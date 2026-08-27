package com.adelvis.fitai;

import android.app.Activity;
import android.app.Instrumentation;
import android.content.Context;
import android.content.Intent;
import android.os.ParcelFileDescriptor;

import com.adelvis.fitai.data.FitRepository;
import com.adelvis.fitai.domain.TrainingEngine;
import com.adelvis.fitai.security.AuthManager;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.FileInputStream;
import java.lang.reflect.Method;
import java.util.Arrays;

@SuppressWarnings("deprecation")
public final class CoreFlowInstrumentedTest extends android.test.InstrumentationTestCase {
    private static final String EMAIL = "qa.fitai28@local.test";
    private static final String PASSWORD = "FitAI#280Strong";
    private Context context;

    @Override protected void setUp() throws Exception {
        super.setUp();
        context = getInstrumentation().getTargetContext();
        context.getSharedPreferences("fitai_auth_v3", Context.MODE_PRIVATE).edit().clear().commit();
    }

    public void testCoachStudentWorkoutNutritionMeasurementsPersistAcrossLogin() throws Exception {
        AuthManager auth = register();
        FitRepository repo = cleanRepository(auth);
        repo.putProfile("goal", "Fuerza");
        repo.putProfile("weight", 80.0);
        repo.add("clients", new JSONObject().put("id", "client-e2e").put("name", "Alumno QA").put("goal", "Fuerza"));
        JSONObject routine = TrainingEngine.generateRoutine("Rutina E2E", Arrays.asList("Pecho", "Espalda"), "double", true);
        repo.add("routines", routine);
        JSONObject exercise = routine.getJSONArray("exercises").getJSONObject(0);
        JSONArray sets = new JSONArray().put(new JSONObject().put("done", true)).put(new JSONObject().put("done", true)).put(new JSONObject().put("done", true));
        JSONObject entry = new JSONObject().put("exerciseId", exercise.getString("id")).put("name", exercise.getString("name"))
                .put("mode", exercise.optString("mode", "weighted")).put("sets", sets).put("completedSets", 3)
                .put("load", 80).put("reps", 10).put("rir", 2);
        repo.add("workouts", new JSONObject().put("id", "workout-e2e").put("routineId", routine.getString("id"))
                .put("routineName", routine.getString("name")).put("date", System.currentTimeMillis())
                .put("entries", new JSONArray().put(entry)));
        repo.add("meals", new JSONObject().put("id", "meal-e2e").put("name", "Comida QA").put("kcal", 500).put("protein", 40).put("date", System.currentTimeMillis()));
        repo.add("measurements", new JSONObject().put("date", System.currentTimeMillis()).put("weight", 80.0).put("waist", 82.0).put("chest", 102.0));
        assertTrue(TrainingEngine.suggest(exercise.getString("id"), exercise.optString("mode", "weighted"), "double",
                repo.state().getJSONArray("workouts"), 80, 10, 0).reps >= 10);
        String exported = repo.exportJson();
        assertTrue(exported.contains("client-e2e"));
        assertTrue(exported.contains("workout-e2e"));
        assertTrue(exported.contains("meal-e2e"));
        auth.logout();
        AuthManager afterRestart = new AuthManager(context);
        assertFalse(afterRestart.isSignedIn());
        assertTrue(afterRestart.login(EMAIL, PASSWORD).ok);
        FitRepository restored = new FitRepository(context, afterRestart);
        JSONObject state = restored.state();
        assertEquals("Fuerza", state.getJSONObject("profile").getString("goal"));
        assertContainsId(state.getJSONArray("clients"), "client-e2e");
        assertContainsId(state.getJSONArray("workouts"), "workout-e2e");
        assertContainsId(state.getJSONArray("meals"), "meal-e2e");
        assertTrue(state.getJSONArray("measurements").length() >= 1);
    }

    public void testOfflineAndDeniedFitnessPermissionsDoNotBlockLocalCore() throws Exception {
        AuthManager auth = register();
        FitRepository repo = cleanRepository(auth);
        shell("svc wifi disable");
        shell("svc data disable");
        shell("pm revoke " + context.getPackageName() + " android.permission.ACTIVITY_RECOGNITION");
        try {
            JSONObject routine = TrainingEngine.generateRoutine("Offline", Arrays.asList("Pecho"), "linear", false);
            repo.add("routines", routine);
            assertNotNull(repo.findRoutine(routine.getString("id")));
            Activity activity = launchMain();
            assertFalse(activity.isFinishing());
            activity.finish();
        } finally {
            shell("svc wifi enable");
            shell("svc data enable");
        }
    }

    public void testCorruptOversizeAndFutureSchemaImportsAreRejectedWithoutDataLoss() throws Exception {
        AuthManager auth = register();
        FitRepository repo = cleanRepository(auth);
        String before = repo.exportJson();
        assertFalse(repo.validateAndImport("not-json").ok);
        assertFalse(repo.validateAndImport(new JSONObject().put("schema", 999).put("routines", new JSONArray())
                .put("workouts", new JSONArray()).put("meals", new JSONArray()).put("measurements", new JSONArray())
                .put("clients", new JSONArray()).put("events", new JSONArray()).toString()).ok);
        StringBuilder huge = new StringBuilder(FitRepository.MAX_IMPORT_BYTES + 16);
        for (int i = 0; i < FitRepository.MAX_IMPORT_BYTES + 8; i++) huge.append('x');
        assertFalse(repo.validateAndImport(huge.toString()).ok);
        assertEquals(before, repo.exportJson());
    }

    public void testLowStorageSignalAndRepositoryRecreationPreserveExistingState() throws Exception {
        AuthManager auth = register();
        FitRepository repo = cleanRepository(auth);
        repo.add("clients", new JSONObject().put("id", "low-storage-client").put("name", "Persistente"));
        shell("cmd devicestoragemonitor force-low -f");
        try {
            FitRepository recreated = new FitRepository(context, new AuthManager(context));
            assertContainsId(recreated.state().getJSONArray("clients"), "low-storage-client");
        } finally {
            shell("cmd devicestoragemonitor reset");
        }
    }

    public void testWorkoutDoubleSubmitPersistsOnlyOnce() throws Exception {
        AuthManager auth = register();
        FitRepository repo = cleanRepository(auth);
        JSONObject routine = TrainingEngine.generateRoutine("Double submit", Arrays.asList("Pecho"), "double", false);
        repo.add("routines", routine);
        Intent intent = new Intent(context, WorkoutLoggerActivity.class).putExtra("routineId", routine.getString("id"));
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        final WorkoutLoggerActivity activity = (WorkoutLoggerActivity) getInstrumentation().startActivitySync(intent);
        assertNotNull(activity);
        final Method save = WorkoutLoggerActivity.class.getDeclaredMethod("saveWorkout");
        save.setAccessible(true);
        getInstrumentation().runOnMainSync(() -> {
            try { save.invoke(activity); save.invoke(activity); }
            catch (Exception e) { throw new RuntimeException(e); }
        });
        getInstrumentation().waitForIdleSync();
        assertEquals(1, new FitRepository(context, new AuthManager(context)).state().getJSONArray("workouts").length());
        activity.finish();
    }

    private AuthManager register() {
        AuthManager auth = new AuthManager(context);
        assertTrue(auth.register(EMAIL, PASSWORD, "QA FitAI").ok);
        return auth;
    }

    private FitRepository cleanRepository(AuthManager auth) {
        context.getSharedPreferences("fitai_user_" + auth.userKey(), Context.MODE_PRIVATE).edit().clear().commit();
        return new FitRepository(context, auth);
    }

    private Activity launchMain() {
        Intent intent = new Intent(context, MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        return getInstrumentation().startActivitySync(intent);
    }

    private void assertContainsId(JSONArray array, String id) {
        for (int i = 0; i < array.length(); i++) if (id.equals(array.optJSONObject(i).optString("id"))) return;
        fail("Missing id " + id);
    }

    private void shell(String command) {
        ParcelFileDescriptor pfd = null;
        try {
            pfd = getInstrumentation().getUiAutomation().executeShellCommand(command);
            if (pfd != null) {
                FileInputStream in = new FileInputStream(pfd.getFileDescriptor());
                byte[] buffer = new byte[1024];
                while (in.read(buffer) != -1) { }
                in.close();
            }
        } catch (Exception ignored) {
            // The negative condition is best-effort across API levels; local-core assertions remain mandatory.
        } finally {
            try { if (pfd != null) pfd.close(); } catch (Exception ignored) { }
        }
    }
}

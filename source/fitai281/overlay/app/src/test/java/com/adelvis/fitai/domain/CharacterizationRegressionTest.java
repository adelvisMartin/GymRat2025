package com.adelvis.fitai.domain;

import org.json.JSONArray;
import org.json.JSONObject;
import org.junit.Test;

import java.util.Arrays;

import static org.junit.Assert.*;

public class CharacterizationRegressionTest {
    @Test public void missedSetsDoNotAdvanceDoubleProgression() throws Exception {
        JSONArray history = new JSONArray().put(new JSONObject().put("entries", new JSONArray().put(
                new JSONObject().put("exerciseId", "bench").put("load", 80).put("reps", 10).put("rir", 2)
                        .put("sets", new JSONArray().put(new JSONObject().put("done", true)).put(new JSONObject().put("done", false))))));
        DomainModels.Suggestion s = TrainingEngine.suggest("bench", "weighted", "double", history, 80, 10, 0);
        assertEquals("repeat", s.kind);
        assertEquals(80.0, s.load, 0.001);
    }

    @Test public void bodyweightProgressesRepsNotFakeLoad() throws Exception {
        JSONArray history = new JSONArray().put(new JSONObject().put("entries", new JSONArray().put(
                new JSONObject().put("exerciseId", "pushup").put("reps", 12)
                        .put("sets", new JSONArray().put(new JSONObject().put("done", true))))));
        DomainModels.Suggestion s = TrainingEngine.suggest("pushup", "bodyweight", "double", history, 0, 12, 0);
        assertEquals("reps", s.kind);
        assertEquals(0.0, s.load, 0.001);
        assertEquals(13, s.reps);
    }

    @Test public void routineGeneratorKeepsSelectedMusclesAndBoundedExerciseCount() {
        JSONObject routine = TrainingEngine.generateRoutine("QA", Arrays.asList("Pecho", "Espalda"), "double", true);
        assertEquals(2, routine.optJSONArray("muscles").length());
        assertTrue(routine.optJSONArray("exercises").length() >= 4);
        assertTrue(routine.optJSONArray("exercises").length() <= 10);
    }
}

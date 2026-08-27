package com.adelvis.fitai;

import android.app.AlertDialog;
import android.os.Bundle;
import android.os.CountDownTimer;
import android.view.*;
import android.widget.*;
import com.adelvis.fitai.data.FitRepository;
import com.adelvis.fitai.domain.DomainModels;
import com.adelvis.fitai.domain.TrainingEngine;
import com.adelvis.fitai.security.AuthManager;
import com.adelvis.fitai.ui.UiKit;
import org.json.JSONArray;
import org.json.JSONObject;
import java.util.*;

public final class WorkoutLoggerActivity extends android.app.Activity {
    private AuthManager auth; private FitRepository repo; private JSONObject routine; private LinearLayout list;
    private final List<EntryForm> forms=new ArrayList<>(); private TextView timerLabel; private CountDownTimer timer; private Button saveButton; private boolean sessionSaved;
    @Override public void onCreate(Bundle b){super.onCreate(b);getWindow().setStatusBarColor(UiKit.BG);getWindow().setNavigationBarColor(UiKit.BG);auth=new AuthManager(this);if(!auth.isSignedIn()){finish();return;}repo=new FitRepository(this,auth);routine=repo.findRoutine(getIntent().getStringExtra("routineId"));if(routine==null){finish();return;}build();}

    private void build(){LinearLayout root=UiKit.col(this);root.setBackgroundColor(UiKit.BG);root.setOnApplyWindowInsetsListener((v,i)->{v.setPadding(0,i.getSystemWindowInsetTop(),0,i.getSystemWindowInsetBottom());return i;});
        LinearLayout top=UiKit.row(this);top.setPadding(UiKit.dp(this,12),UiKit.dp(this,10),UiKit.dp(this,12),UiKit.dp(this,8));Button back=UiKit.secondary(this,"‹");back.setOnClickListener(v->finish());top.addView(back,new LinearLayout.LayoutParams(UiKit.dp(this,52),UiKit.dp(this,50)));TextView title=UiKit.heading(this,routine.optString("name"));top.addView(title,new LinearLayout.LayoutParams(0,-2,1));timerLabel=UiKit.text(this,"00:00",15,UiKit.TEAL);top.addView(timerLabel);root.addView(top);
        ScrollView s=new ScrollView(this);list=UiKit.col(this);list.setPadding(UiKit.dp(this,14),UiKit.dp(this,4),UiKit.dp(this,14),UiKit.dp(this,24));s.addView(list);root.addView(s,new LinearLayout.LayoutParams(-1,0,1));
        LinearLayout bar=UiKit.row(this);bar.setPadding(UiKit.dp(this,10),UiKit.dp(this,8),UiKit.dp(this,10),UiKit.dp(this,8));bar.setBackgroundColor(UiKit.SURFACE);Button rest=UiKit.secondary(this,"Descanso");saveButton=UiKit.primary(this,"Guardar sesión");bar.addView(rest,new LinearLayout.LayoutParams(0,UiKit.dp(this,52),1));Space sp=new Space(this);bar.addView(sp,new LinearLayout.LayoutParams(UiKit.dp(this,8),1));bar.addView(saveButton,new LinearLayout.LayoutParams(0,UiKit.dp(this,52),2));root.addView(bar);rest.setOnClickListener(v->startRest(routine.optInt("rest",90)));saveButton.setOnClickListener(v->saveWorkout());setContentView(root);renderExercises();}

    private void renderExercises(){list.removeAllViews();forms.clear();list.addView(UiKit.muted(this,"Marca cada serie completada. Las series sin marcar se guardan como incompletas para que la progresión no confunda un fallo con éxito."));UiKit.gap(list,10);JSONArray es=routine.optJSONArray("exercises"), history=repo.state().optJSONArray("workouts");for(int i=0;es!=null&&i<es.length();i++){JSONObject e=es.optJSONObject(i);EntryForm f=new EntryForm();f.exercise=e;LinearLayout c=UiKit.card(this);String sup=e.optString("superset","");TextView h=UiKit.heading(this,e.optString("name"));c.addView(h);c.addView(UiKit.muted(this,e.optString("muscle")+(sup.isEmpty()?"":" · Superserie "+sup)));String mode=e.optString("mode","weighted");DomainModels.Suggestion sug=TrainingEngine.suggest(e.optString("id"),mode,routine.optString("policy","double"),history,e.optDouble("weight",0),e.optInt("reps",10),e.optInt("sec",45));c.addView(UiKit.muted(this,"Sugerencia: "+formatSuggestion(sug)+"\n"+sug.reason));UiKit.gap(c,6);
            f.load=UiKit.number(this,"Carga kg");f.reps=UiKit.number(this,"Reps por serie");f.seconds=UiKit.number(this,"Segundos");f.rir=UiKit.number(this,"RIR (0–5)");if(sug.load>0)f.load.setText(String.valueOf(sug.load));if(sug.reps>0)f.reps.setText(String.valueOf(sug.reps));if(sug.seconds>0)f.seconds.setText(String.valueOf(sug.seconds));f.rir.setText("2");
            if(mode.equals("weighted")){c.addView(f.load);c.addView(f.reps);c.addView(f.rir);}else if(mode.equals("bodyweight")){c.addView(f.reps);c.addView(f.rir);}else{c.addView(f.seconds);if(mode.equals("cardio")){f.distance=UiKit.number(this,"Distancia km (opcional)");c.addView(f.distance);}}
            LinearLayout checks=UiKit.col(this);int sets=Math.max(1,e.optInt("sets",3));f.checks=new CheckBox[sets];for(int k=0;k<sets;k++){CheckBox cb=new CheckBox(this);cb.setText("Serie "+(k+1)+" completada");cb.setTextColor(UiKit.TEXT);cb.setMinHeight(UiKit.dp(this,48));checks.addView(cb);f.checks[k]=cb;}c.addView(checks);f.notes=UiKit.field(this,"Notas de técnica / sesión");c.addView(f.notes);forms.add(f);list.addView(c);UiKit.gap(list,10);}}

    private String formatSuggestion(DomainModels.Suggestion s){if(s.load>0)return String.format(Locale.getDefault(),"%.1f kg · %d reps",s.load,s.reps);if(s.reps>0)return s.reps+" reps";if(s.seconds>0)return s.seconds+" s";return "mantén tu referencia";}
    private void startRest(int sec){if(timer!=null)timer.cancel();timer=new CountDownTimer(sec*1000L,1000){public void onTick(long m){timerLabel.setText(String.format(Locale.getDefault(),"%02d:%02d",m/60000,(m/1000)%60));}public void onFinish(){timerLabel.setText("Listo");Toast.makeText(WorkoutLoggerActivity.this,"Descanso completado",Toast.LENGTH_SHORT).show();}}.start();}
    private void saveWorkout(){if(sessionSaved)return;sessionSaved=true;if(saveButton!=null)saveButton.setEnabled(false);try{JSONArray entries=new JSONArray();for(EntryForm f:forms){JSONObject e=f.exercise;JSONArray sets=new JSONArray();int done=0;for(CheckBox cb:f.checks){boolean d=cb.isChecked();if(d)done++;sets.put(new JSONObject().put("done",d));}JSONObject x=new JSONObject().put("exerciseId",e.optString("id")).put("name",e.optString("name")).put("mode",e.optString("mode")).put("sets",sets).put("completedSets",done).put("load",num(f.load)).put("reps",integer(f.reps)).put("seconds",integer(f.seconds)).put("rir",Math.max(0,Math.min(5,integer(f.rir)))).put("distanceKm",num(f.distance)).put("notes",f.notes.getText().toString().trim());entries.put(x);}JSONObject w=new JSONObject().put("id",UUID.randomUUID().toString()).put("routineId",routine.optString("id")).put("routineName",routine.optString("name")).put("date",System.currentTimeMillis()).put("entries",entries);repo.add("workouts",w);new AlertDialog.Builder(this).setTitle("Sesión guardada").setMessage("Se registraron "+entries.length()+" ejercicios. FitAI usará este historial para sugerencias futuras.").setPositiveButton("Cerrar",(d,x)->finish()).show();}catch(Exception e){sessionSaved=false;if(saveButton!=null)saveButton.setEnabled(true);Toast.makeText(this,"No se pudo guardar la sesión",Toast.LENGTH_LONG).show();}}
    private double num(EditText e){if(e==null)return 0;String s=e.getText().toString().trim();try{return s.isEmpty()?0:Double.parseDouble(s);}catch(Exception x){return 0;}}
    private int integer(EditText e){return (int)Math.round(num(e));}
    private static final class EntryForm{JSONObject exercise;EditText load,reps,seconds,rir,distance,notes;CheckBox[] checks;}
}

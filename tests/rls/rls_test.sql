\set ON_ERROR_STOP 1
-- seed as superuser (like the service role / edge function)
insert into auth.users values ('a0000000-0000-0000-0000-00000000000a'),('a0000000-0000-0000-0000-000000000001'),('a0000000-0000-0000-0000-000000000002'),('a0000000-0000-0000-0000-000000000003'),('b0000000-0000-0000-0000-00000000000b'),('b0000000-0000-0000-0000-000000000001');
insert into schools(id,name) values ('aaaaaaaa-0000-0000-0000-000000000000','Escuela A'),('bbbbbbbb-0000-0000-0000-000000000000','Escuela B');
insert into profiles(id,school_id,role,username,name,group_id) values
 ('a0000000-0000-0000-0000-00000000000a','aaaaaaaa-0000-0000-0000-000000000000','admin','profe.a','Profe A',null),
 ('a0000000-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000000','student','ana','Ana','g1'),
 ('a0000000-0000-0000-0000-000000000002','aaaaaaaa-0000-0000-0000-000000000000','student','sofia','Sofía','g1'),
 ('a0000000-0000-0000-0000-000000000003','aaaaaaaa-0000-0000-0000-000000000000','student','mateo','Mateo','g2'),
 ('b0000000-0000-0000-0000-00000000000b','bbbbbbbb-0000-0000-0000-000000000000','admin','profe.b','Profe B',null),
 ('b0000000-0000-0000-0000-000000000001','bbbbbbbb-0000-0000-0000-000000000000','student','tom','Tom','g1');
insert into progress(user_id,school_id,data) values ('a0000000-0000-0000-0000-000000000002','aaaaaaaa-0000-0000-0000-000000000000','{"xp":120,"xpDays":{},"days":[]}'),('a0000000-0000-0000-0000-000000000003','aaaaaaaa-0000-0000-0000-000000000000','{"xp":50}');
insert into groups(school_id,id,name,open) values ('aaaaaaaa-0000-0000-0000-000000000000','g1','Sábados','{"u1":true}'),('bbbbbbbb-0000-0000-0000-000000000000','g1','B grupo','{}');

create or replace function pg_temp.check(label text, ok boolean) returns void language plpgsql as $$ begin raise notice '% %', case when ok then 'PASS' else 'FAIL' end, label; end $$;
create or replace function pg_temp.fails(sqltext text) returns boolean language plpgsql as $$ begin execute sqltext; return false; exception when others then return true; end $$;

-- ===== student Ana =====
begin; set local role authenticated; set local request.jwt.claim.sub = 'a0000000-0000-0000-0000-000000000001';
select pg_temp.check('1 estudiante solo ve su perfil', (select count(*) from profiles) = 1);
select pg_temp.check('2 ranking solo de su grupo (Ana+Sofía)', (select count(*) from class_ranking()) = 2 and (select max(xp) from class_ranking()) = 120);
select pg_temp.check('3 no lee progreso ajeno', (select count(*) from progress) = 0);
select pg_temp.check('4a guarda su propio progreso', not pg_temp.fails($q$insert into progress(user_id,school_id,data) values ('a0000000-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000000','{"xp":10}')$q$));
select pg_temp.check('4b no puede escribir progreso de otro', pg_temp.fails($q$insert into progress(user_id,school_id,data) values ('a0000000-0000-0000-0000-000000000002','aaaaaaaa-0000-0000-0000-000000000000','{"xp":9999}') on conflict (user_id) do update set data = excluded.data$q$));
-- un xp raro (texto, decimal, enorme) no debe romper el ranking del grupo: cuenta como 0
update progress set data='{"xp":"x","days":5,"xpDays":[1]}' where user_id = auth.uid();
select pg_temp.check('4c xp de texto no rompe el ranking', not pg_temp.fails($q$select * from class_ranking()$q$) and (select xp from class_ranking() where user_id = auth.uid()) = 0 and (select jsonb_typeof(days) from class_ranking() where user_id = auth.uid()) = 'array');
update progress set data='{"xp":99999999999}' where user_id = auth.uid();
select pg_temp.check('4d xp enorme no rompe el ranking', not pg_temp.fails($q$select * from class_ranking()$q$) and (select xp from class_ranking() where user_id = auth.uid()) = 0);
-- fechas raras o muy viejas en xpDays no llegan a los compañeros (congelaban su Ranking): solo pasa la de hoy
update progress set data = jsonb_build_object('xp', 10, 'xpDays', jsonb_build_object('-271800-01-01', 1, '2000-01-01', 5, '2026-01-01x', 3, to_char(current_date, 'YYYY-MM-DD'), 7, to_char(current_date - 1, 'YYYY-MM-DD'), 'x')) where user_id = auth.uid();
select pg_temp.check('4f el ranking solo pasa fechas válidas y recientes', (select xp_days from class_ranking() where user_id = auth.uid()) = jsonb_build_object(to_char(current_date, 'YYYY-MM-DD'), 7));
update progress set data='{"xp":10}' where user_id = auth.uid();
select pg_temp.check('4e no puede cerrar sesiones de otra cuenta', pg_temp.fails($q$select public.revoke_user_sessions('a0000000-0000-0000-0000-000000000002')$q$));
with u as (update groups set name='hack' returning 1) select pg_temp.check('5 no puede cambiar grupos', (select count(*) from u) = 0);
with u as (update profiles set group_id='g2' where id = auth.uid() returning 1) select pg_temp.check('6 no puede cambiarse de grupo', (select count(*) from u) = 0);
select pg_temp.check('6b no puede cambiarse el rol', pg_temp.fails($q$update profiles set role='admin' where id = auth.uid()$q$));
insert into submissions(school_id,assignment_id,user_id,text,sent_at,note,reviewed) values ('aaaaaaaa-0000-0000-0000-000000000000','a1','a0000000-0000-0000-0000-000000000001','I like cats.',current_date,'¡Perfecto! (yo)',true);
select pg_temp.check('7 no puede calificarse sola', (select note='' and not reviewed from submissions where user_id = auth.uid()));
select pg_temp.check('7b ve las tareas y unidades de su escuela', (select count(*) from groups) = 1);
select pg_temp.check('7c no puede borrar el curso', pg_temp.fails($q$insert into courses(school_id,data) values ('aaaaaaaa-0000-0000-0000-000000000000','{}')$q$));
commit;

-- ===== admin A =====
begin; set local role authenticated; set local request.jwt.claim.sub = 'a0000000-0000-0000-0000-00000000000a';
select pg_temp.check('8 admin ve los 4 perfiles de su escuela', (select count(*) from profiles) = 4);
select pg_temp.check('8b admin ve progresos de su escuela', (select count(*) from progress) = 3);
with u as (update submissions set note='Muy bien', reviewed=true where assignment_id='a1' returning 1) select pg_temp.check('9 admin califica la escritura', (select count(*) from u) = 1);
select pg_temp.check('9b nota guardada', (select note from submissions where assignment_id='a1') = 'Muy bien');
with u as (update profiles set group_id='g2' where username='sofia' returning 1) select pg_temp.check('10 admin mueve estudiante de grupo', (select count(*) from u) = 1);
select pg_temp.check('11 admin no puede cambiar roles', pg_temp.fails($q$update profiles set role='admin' where username='ana'$q$));
select pg_temp.check('12 admin guarda el curso', not pg_temp.fails($q$insert into courses(school_id,data) values ('aaaaaaaa-0000-0000-0000-000000000000','{"units":[]}') on conflict (school_id) do update set data=excluded.data$q$));
select pg_temp.check('13 admin crea grupo y tarea', not pg_temp.fails($q$insert into groups(school_id,id,name) values ('aaaaaaaa-0000-0000-0000-000000000000','g2','Martes'); insert into assignments(school_id,id,title,due,lessons,groups) values ('aaaaaaaa-0000-0000-0000-000000000000','a1','Semana 1',current_date,'{u1l1}','{g1}')$q$));
select pg_temp.check('14 admin NO ve la otra escuela', (select count(*) from profiles where school_id='bbbbbbbb-0000-0000-0000-000000000000') = 0 and (select count(*) from groups where school_id='bbbbbbbb-0000-0000-0000-000000000000') = 0);
select pg_temp.check('15 admin NO escribe en la otra escuela', pg_temp.fails($q$insert into groups(school_id,id,name) values ('bbbbbbbb-0000-0000-0000-000000000000','gx','hack')$q$));
with u as (update progress set data='{}' returning 1) select pg_temp.check('15b admin NO cambia progreso de estudiantes', (select count(*) from u) = 0);
commit;

-- ===== Ana after review =====
begin; set local role authenticated; set local request.jwt.claim.sub = 'a0000000-0000-0000-0000-000000000001';
with u as (update submissions set text='cambio' where user_id=auth.uid() returning 1) select pg_temp.check('16 no edita la escritura ya revisada', (select count(*) from u) = 0);
select pg_temp.check('16b ve la nota del profe', (select note from submissions where user_id=auth.uid()) = 'Muy bien');
select pg_temp.check('17 ranking tras mover a Sofía (solo Ana)', (select count(*) from class_ranking()) = 1);
commit;

-- ===== calificación (nota 0-100 e historial) =====
begin; set local role authenticated; set local request.jwt.claim.sub = 'a0000000-0000-0000-0000-000000000001';
update submissions set grade=100, history='[{"x":1}]' where user_id=auth.uid();
select pg_temp.check('G1 el estudiante no se pone nota ni historial', (select grade is null and history = '[]'::jsonb from submissions where user_id=auth.uid()));
commit;
begin; set local role authenticated; set local request.jwt.claim.sub = 'a0000000-0000-0000-0000-00000000000a';
with u as (update submissions set grade=95, history='[{"reason":"revisé otra vez"}]' where assignment_id='a1' and user_id='a0000000-0000-0000-0000-000000000001' returning 1) select pg_temp.check('G2 el admin guarda nota e historial con update', (select count(*) from u) = 1);
select pg_temp.check('G4 el admin NO puede pasar una entrega a un niño de otra escuela', pg_temp.fails($q$update submissions set user_id='b0000000-0000-0000-0000-000000000001' where assignment_id='a1' and user_id='a0000000-0000-0000-0000-000000000001'$q$));
select pg_temp.check('G5 el admin NO puede cambiar de qué tarea es una entrega', pg_temp.fails($q$update submissions set assignment_id='otra' where assignment_id='a1' and user_id='a0000000-0000-0000-0000-000000000001'$q$));
select pg_temp.check('G3 el admin NO puede hacer upsert (insertar) entregas a nombre del niño', pg_temp.fails($q$insert into submissions(school_id,assignment_id,user_id,note,reviewed) values ('aaaaaaaa-0000-0000-0000-000000000000','a1','a0000000-0000-0000-0000-000000000001','x',true) on conflict (assignment_id,user_id) do update set note=excluded.note$q$));
commit;

-- ===== amigos =====
insert into auth.users values ('a0000000-0000-0000-0000-000000000004');
insert into profiles(id,school_id,role,username,name,group_id) values ('a0000000-0000-0000-0000-000000000004','aaaaaaaa-0000-0000-0000-000000000000','student','luis','Luis','g1');
begin; set local role authenticated; set local request.jwt.claim.sub = 'a0000000-0000-0000-0000-000000000001';
select pg_temp.check('F1 Ana envía solicitud a Luis (mismo grupo)', not pg_temp.fails($q$insert into friendships(school_id,from_id,to_id) values ('aaaaaaaa-0000-0000-0000-000000000000','a0000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000004')$q$));
select pg_temp.check('F2 no puede enviar a otro grupo (Mateo)', pg_temp.fails($q$insert into friendships(school_id,from_id,to_id) values ('aaaaaaaa-0000-0000-0000-000000000000','a0000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000003')$q$));
select pg_temp.check('F3 no puede enviar a otra escuela (Tom)', pg_temp.fails($q$insert into friendships(school_id,from_id,to_id) values ('aaaaaaaa-0000-0000-0000-000000000000','a0000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000001')$q$));
select pg_temp.check('F4 no puede crear una amistad ya aceptada', pg_temp.fails($q$insert into friendships(school_id,from_id,to_id,status) values ('aaaaaaaa-0000-0000-0000-000000000000','a0000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000002','accepted')$q$));
with u as (update friendships set status='accepted' returning 1) select pg_temp.check('F5 no puede aceptar su propia solicitud', (select count(*) from u) = 0);
select pg_temp.check('F6 no puede enviar a nombre de otro', pg_temp.fails($q$insert into friendships(school_id,from_id,to_id) values ('aaaaaaaa-0000-0000-0000-000000000000','a0000000-0000-0000-0000-000000000004','a0000000-0000-0000-0000-000000000001')$q$));
commit;
begin; set local role authenticated; set local request.jwt.claim.sub = 'a0000000-0000-0000-0000-000000000004';
select pg_temp.check('F7 Luis ve la solicitud', (select count(*) from friendships) = 1);
with u as (update friendships set status='accepted' where to_id=auth.uid() returning 1) select pg_temp.check('F8 Luis acepta', (select count(*) from u) = 1);
select pg_temp.check('F8b al aceptar no puede cambiar quién la envió', pg_temp.fails($q$update friendships set from_id='a0000000-0000-0000-0000-000000000002' where to_id=auth.uid()$q$));
select pg_temp.check('F8c al aceptar no puede pasarla a otra escuela', pg_temp.fails($q$update friendships set school_id='bbbbbbbb-0000-0000-0000-000000000000' where to_id=auth.uid()$q$));
select pg_temp.check('F9 ranking incluye avatar (columna)', (select count(*) from class_ranking() where avatar is null) >= 0);
commit;
begin; set local role authenticated; set local request.jwt.claim.sub = 'a0000000-0000-0000-0000-000000000003';
select pg_temp.check('F10 Mateo no ve amistades ajenas', (select count(*) from friendships) = 0);
commit;
begin; set local role authenticated; set local request.jwt.claim.sub = 'a0000000-0000-0000-0000-000000000001';
with d as (delete from friendships returning 1) select pg_temp.check('F11 Ana puede quitar la amistad', (select count(*) from d) = 1);
commit;

-- ===== anonymous =====
begin; set local role anon;
select pg_temp.check('18 sin sesión no ve nada', pg_temp.fails('select * from profiles') and pg_temp.fails('select * from progress'));
commit;

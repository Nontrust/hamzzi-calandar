select cron.schedule(
  'exam-ingestion-sync',
  '0 7,13,19 * * *',
  $$
    select net.http_post(
      url := 'https://<project-ref>.functions.supabase.co/exam-ingestion-sync',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := jsonb_build_object('trigger', 'cron')
    );
  $$
);
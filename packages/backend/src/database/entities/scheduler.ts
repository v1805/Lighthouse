import { Knex } from 'knex';

export const SchedulerTableName = 'scheduler';
export const SchedulerSlackTargetTableName = 'scheduler_slack_target';
export const SchedulerEmailTargetTableName = 'scheduler_email_target';
export const SchedulerLogTableName = 'scheduler_log';

export type SchedulerDb = {
    scheduler_uuid: string;
    name: string;
    format: string;
    created_at: Date;
    updated_at: Date;
    created_by: string;
    cron: string;
    saved_chart_uuid: string | null;
    dashboard_uuid: string | null;
    options: Record<string, any>;
};

export type ChartSchedulerDb = SchedulerDb & {
    saved_chart_uuid: string;
    dashboard_uuid: null;
};
export type DashboardSchedulerDB = SchedulerDb & {
    saved_chart_uuid: null;
    dashboard_uuid: string;
};

export type SchedulerSlackTargetDb = {
    scheduler_slack_target_uuid: string;
    created_at: Date;
    updated_at: Date;
    scheduler_uuid: string;
    channel: string; // slack channel id
};

export type SchedulerEmailTargetDb = {
    scheduler_email_target_uuid: string;
    created_at: Date;
    updated_at: Date;
    scheduler_uuid: string;
    recipient: string; // email address
};

export type SchedulerTable = Knex.CompositeTableType<
    SchedulerDb,
    Omit<
        ChartSchedulerDb | DashboardSchedulerDB,
        'scheduler_uuid' | 'created_at'
    >,
    Pick<SchedulerDb, 'name' | 'updated_at' | 'cron' | 'format' | 'options'>
>;

export type SchedulerSlackTargetTable = Knex.CompositeTableType<
    SchedulerSlackTargetDb,
    Omit<SchedulerSlackTargetDb, 'scheduler_slack_target_uuid' | 'created_at'>,
    Pick<SchedulerSlackTargetDb, 'channel' | 'updated_at'>
>;

export type SchedulerEmailTargetTable = Knex.CompositeTableType<
    SchedulerEmailTargetDb,
    Omit<SchedulerEmailTargetDb, 'scheduler_email_target_uuid' | 'created_at'>,
    Pick<SchedulerEmailTargetDb, 'recipient' | 'updated_at'>
>;

export type SchedulerLogDb = {
    task: string;
    scheduler_uuid?: string;
    job_id: string;
    created_at: Date;
    scheduled_time: Date;
    job_group?: string;
    status: string;
    target: string | null;
    target_type: string | null;
    details: Record<string, any> | null;
};

export type SchedulerLogTable = Knex.CompositeTableType<
    SchedulerLogDb,
    Omit<SchedulerLogDb, 'created_at'>
>;

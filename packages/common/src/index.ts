import { UserActivity } from './types/analytics';
import {
    Dashboard,
    DashboardAvailableFilters,
    DashboardBasicDetails,
} from './types/dashboard';
import { convertAdditionalMetric } from './types/dbt';
import {
    DbtCloudIntegration,
    DbtCloudMetadataResponseMetrics,
} from './types/dbtCloud';
import { Explore, SummaryExplore } from './types/explore';
import {
    CompiledDimension,
    CompiledField,
    CompiledMetric,
    DimensionType,
    Field,
    FieldId,
    fieldId,
    FilterableField,
    Metric,
    TableCalculation,
} from './types/field';
import {
    AdditionalMetric,
    isAdditionalMetric,
    MetricQuery,
} from './types/metricQuery';
import {
    OrganizationMemberProfile,
    OrganizationMemberRole,
} from './types/organizationMemberProfile';
import {
    CreatePersonalAccessToken,
    PersonalAccessToken,
} from './types/personalAccessToken';
import {
    ProjectMemberProfile,
    ProjectMemberRole,
} from './types/projectMemberProfile';
import { ResultRow } from './types/results';
import { SavedChart, Series } from './types/savedCharts';
import { SearchResults } from './types/search';
import { ShareUrl } from './types/share';
import { SlackSettings } from './types/slackSettings';

import { EmailStatusExpiring } from './types/email';
import { FieldValueSearchResult } from './types/fieldMatch';
import {
    AllowedEmailDomains,
    OnboardingStatus,
    Organization,
    OrganizationProject,
    UpdateAllowedEmailDomains,
} from './types/organization';
import {
    CreateWarehouseCredentials,
    DbtProjectConfig,
    DbtProjectType,
    Project,
    ProjectType,
    WarehouseCredentials,
} from './types/projects';
import { SchedulerAndTargets, SchedulerWithLogs } from './types/scheduler';
import { SlackChannel } from './types/slack';
import { Space } from './types/space';
import { TableBase } from './types/table';
import { LightdashUser, UserAllowedOrganization } from './types/user';
import { formatItemValue } from './utils/formatting';
import { getItemId, getItemLabelWithoutTableName } from './utils/item';

export * from './authorization/index';
export * from './authorization/types';
export * from './compiler/exploreCompiler';
export * from './compiler/filtersCompiler';
export * from './compiler/translator';
export { default as lightdashDbtYamlSchema } from './schemas/json/lightdash-dbt-2.0.json';
export * from './templating/template';
export * from './types/analytics';
export * from './types/api';
export * from './types/api/errors';
export * from './types/api/integrations';
export * from './types/api/share';
export * from './types/api/success';
export * from './types/conditionalFormatting';
export * from './types/conditionalRule';
export * from './types/csv';
export * from './types/dashboard';
export * from './types/dbt';
export * from './types/dbtCloud';
export * from './types/email';
export * from './types/errors';
export * from './types/explore';
export * from './types/field';
export * from './types/fieldMatch';
export * from './types/filter';
export * from './types/job';
export * from './types/metricQuery';
export * from './types/organization';
export * from './types/organizationMemberProfile';
export * from './types/personalAccessToken';
export * from './types/pinning';
export * from './types/pivot';
export * from './types/projectMemberProfile';
export * from './types/projects';
export * from './types/resourceViewItem';
export * from './types/results';
export * from './types/savedCharts';
export * from './types/scheduler';
export * from './types/search';
export * from './types/share';
export * from './types/slack';
export * from './types/slackSettings';
export * from './types/space';
export * from './types/table';
export * from './types/timeFrames';
export * from './types/user';
export * from './types/warehouse';
export * from './utils/api';
export { default as assertUnreachable } from './utils/assertUnreachable';
export * from './utils/conditionalFormatting';
export * from './utils/email';
export * from './utils/filters';
export * from './utils/formatting';
export * from './utils/github';
export * from './utils/item';
export * from './utils/scheduler';
export * from './utils/time';
export * from './utils/timeFrames';

export const validateEmail = (email: string): boolean => {
    const re =
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
};

export const hasIntersection = (tags: string[], tags2: string[]): boolean => {
    const intersection = tags.filter((value) => tags2.includes(value));
    return intersection.length > 0;
};

export const toggleArrayValue = <T = string>(
    initialArray: T[],
    value: T,
): T[] => {
    const array = [...initialArray];
    const index = array.indexOf(value);
    if (index === -1) {
        array.push(value);
    } else {
        array.splice(index, 1);
    }
    return array;
};

export const replaceStringInArray = (
    arrayToUpdate: string[],
    valueToReplace: string,
    newValue: string,
) =>
    arrayToUpdate.map((value) => (value === valueToReplace ? newValue : value));

export type SqlResultsRow = { [columnName: string]: any };
export type SqlResultsField = { name: string; type: string }; // TODO: standardise column types
export type SqlQueryResults = {
    fields: SqlResultsField[]; // TODO: standard column types
    rows: SqlResultsRow[];
};

export function hexToRGB(hex: string, alpha: number | undefined): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);

    if (alpha !== undefined) {
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    return `rgb(${r}, ${g}, ${b})`;
}

// Seeds

export const SEED_ORG_1 = {
    organization_uuid: '172a2270-000f-42be-9c68-c4752c23ae51',
    organization_name: 'Jaffle Shop',
};
export const SEED_ORG_1_ADMIN = {
    user_uuid: 'b264d83a-9000-426a-85ec-3f9c20f368ce',
    first_name: 'David',
    last_name: 'Attenborough',
    is_marketing_opted_in: true,
    is_tracking_anonymized: false,
    is_setup_complete: true,
    is_active: true,
};
export const SEED_ORG_1_ADMIN_EMAIL = {
    email: 'demo@lightdash.com',
    is_primary: true,
};
export const SEED_ORG_1_ADMIN_PASSWORD = {
    password: 'demo_password!',
};
// Another user
export const SEED_ORG_2 = {
    organization_uuid: '42339eef-359e-4ec4-b810-54ef0b4e3446',
    organization_name: 'Another Shop',
};
export const SEED_ORG_2_ADMIN = {
    user_uuid: '57cd4548-cbe3-42b3-aa13-97821713e307',
    first_name: 'Another',
    last_name: 'User',
    is_marketing_opted_in: true,
    is_tracking_anonymized: false,
    is_setup_complete: true,
    is_active: true,
};
export const SEED_ORG_2_ADMIN_EMAIL = {
    email: 'another@lightdash.com',
    is_primary: true,
};
export const SEED_ORG_2_ADMIN_PASSWORD = {
    password: 'demo_password!',
};

export const SEED_PROJECT = {
    project_uuid: '3675b69e-8324-4110-bdca-059031aa8da3',
    name: 'Jaffle shop',
    project_type: ProjectType.DEFAULT,
    dbt_connection_type: DbtProjectType.DBT,
    dbt_connection: null,
};
export const SEED_SPACE = {
    name: SEED_PROJECT.name,
};

export type ArgumentsOf<F extends Function> = F extends (
    ...args: infer A
) => any
    ? A
    : never;

// Helper function to get a list of all dimensions in an explore
export const getDimensions = (explore: Explore): CompiledDimension[] =>
    Object.values(explore.tables).flatMap((t) => Object.values(t.dimensions));

// Helper function to get a list of all metrics in an explore
export const getMetrics = (explore: Explore): CompiledMetric[] =>
    Object.values(explore.tables).flatMap((t) => Object.values(t.metrics));

export const getFields = (explore: Explore): CompiledField[] => [
    ...getDimensions(explore),
    ...getMetrics(explore),
];

export const getVisibleFields = (explore: Explore): CompiledField[] =>
    getFields(explore).filter(({ hidden }) => !hidden);

export const findFieldByIdInExplore = (
    explore: Explore,
    id: FieldId,
): Field | undefined =>
    getFields(explore).find((field) => fieldId(field) === id);

export const snakeCaseName = (text: string): string =>
    text
        .replace(/\W+/g, ' ')
        .split(/ |\B(?=[A-Z])/)
        .map((word) => word.toLowerCase())
        .join('_');

export const hasSpecialCharacters = (text: string) => /[^a-zA-Z ]/g.test(text);

export type ApiQueryResults = {
    metricQuery: MetricQuery;
    rows: ResultRow[];
};

export type ApiSqlQueryResults = {
    fields: Record<string, { type: DimensionType }>;
    rows: { [col: string]: any }[];
};

export type ApiScheduledDownloadCsv = {
    jobId: string;
};
export type ApiDownloadCsv = {
    url: string;
};

export type ProjectCatalog = {
    [database: string]: {
        [schema: string]: {
            [table: string]: Pick<TableBase, 'description' | 'sqlTable'>;
        };
    };
};

export enum TableSelectionType {
    ALL = 'ALL',
    WITH_TAGS = 'WITH_TAGS',
    WITH_NAMES = 'WITH_NAMES',
}

export type TablesConfiguration = {
    tableSelection: {
        type: TableSelectionType;
        value: string[] | null;
    };
};

export type CreateProjectMember = {
    email: string;
    role: ProjectMemberRole;
    sendEmail: boolean;
};

export type UpdateProjectMember = {
    role: ProjectMemberRole;
};

export type ApiCompiledQueryResults = string;

export type ApiExploresResults = SummaryExplore[];

export type ApiExploreResults = Explore;

export type ApiStatusResults = 'loading' | 'ready' | 'error';

export type ApiRefreshResults = {
    jobUuid: string;
};

export type ApiJobStartedResults = {
    jobUuid: string;
};

export type ApiCreateUserTokenResults = {
    token: string;
    expiresAt: Date;
};

export type ActivateUser = {
    firstName: string;
    lastName: string;
    password: string;
};

export type CreateUserArgs = {
    firstName: string;
    lastName: string;
    email: string;
    password?: string;
};

export type CreateUserWithRole = {
    firstName: string;
    lastName: string;
    email: string;
    password?: string;
    role: OrganizationMemberRole;
};

export type CreateOrganizationUser = CreateUserArgs & {
    inviteCode: string;
};

export type CompleteUserArgs = {
    organizationName?: string;
    jobTitle: string;
    isMarketingOptedIn: boolean;
    isTrackingAnonymized: boolean;
    enableEmailDomainAccess: boolean;
};

export type UpdateUserArgs = {
    firstName: string;
    lastName: string;
    email: string;
    isMarketingOptedIn: boolean;
    isTrackingAnonymized: boolean;
    isSetupComplete: boolean;
};

export type CreateOpenIdIdentity = {
    subject: string;
    issuer: string;
    issuerType: 'google' | 'okta' | 'oneLogin';
    userId: number;
    email: string;
};

export type UpdateOpenIdentity = Pick<
    CreateOpenIdIdentity,
    'subject' | 'issuer' | 'email' | 'issuerType'
>;

export type OpenIdIdentity = CreateOpenIdIdentity & {
    createdAt: Date;
};

export type OpenIdIdentitySummary = Pick<
    OpenIdIdentity,
    'issuer' | 'email' | 'createdAt' | 'issuerType'
>;

export type DeleteOpenIdentity = Pick<
    OpenIdIdentitySummary,
    'issuer' | 'email'
>;

export type PasswordResetLink = {
    expiresAt: Date;
    code: string;
    email: string;
    url: string;
    isExpired: boolean;
};

export type CreatePasswordResetLink = Pick<PasswordResetLink, 'email'>;

export type PasswordReset = {
    code: string;
    newPassword: string;
};

export type ApiHealthResults = HealthState;
export type InviteLink = {
    expiresAt: Date;
    inviteCode: string;
    inviteUrl: string;
    organizationUuid: string;
    userUuid: string;
    email: string;
};
export type CreateInviteLink = Pick<InviteLink, 'expiresAt' | 'email'> & {
    email: string;
    role?: OrganizationMemberRole;
};

export type ProjectSavedChartStatus = boolean;

export type ApiFlashResults = Record<string, string[]>;

type ApiResults =
    | ApiQueryResults
    | ApiSqlQueryResults
    | ApiCompiledQueryResults
    | ApiExploresResults
    | ApiExploreResults
    | ApiStatusResults
    | ApiRefreshResults
    | ApiHealthResults
    | Organization
    | LightdashUser
    | SavedChart
    | SavedChart[]
    | Space[]
    | InviteLink
    | OrganizationProject[]
    | Project
    | WarehouseCredentials
    | OrganizationMemberProfile[]
    | ProjectCatalog
    | TablesConfiguration
    | Dashboard
    | DashboardBasicDetails[]
    | OnboardingStatus
    | Dashboard[]
    | DeleteOpenIdentity
    | ApiFlashResults
    | OpenIdIdentitySummary[]
    | FilterableField[]
    | DashboardAvailableFilters
    | ProjectSavedChartStatus
    | undefined
    | Array<unknown>
    | ApiJobStartedResults
    | ApiCreateUserTokenResults
    | CreatePersonalAccessToken
    | PersonalAccessToken
    | ProjectMemberProfile[]
    | SearchResults
    | Space
    | DbtCloudMetadataResponseMetrics
    | DbtCloudIntegration
    | ShareUrl
    | SlackSettings
    | UserActivity
    | SlackChannel[]
    | SchedulerAndTargets
    | SchedulerAndTargets[]
    | FieldValueSearchResult
    | ApiDownloadCsv
    | AllowedEmailDomains
    | UpdateAllowedEmailDomains
    | UserAllowedOrganization[]
    | EmailStatusExpiring
    | ApiScheduledDownloadCsv
    | SchedulerWithLogs;

export type ApiResponse = {
    status: 'ok';
    results: ApiResults;
};

type ApiErrorDetail = {
    name: string;
    statusCode: number;
    message: string;
    data: { [key: string]: string };
};
export type ApiError = {
    status: 'error';
    error: ApiErrorDetail;
};

export enum LightdashMode {
    DEFAULT = 'default',
    DEMO = 'demo',
    PR = 'pr',
    CLOUD_BETA = 'cloud_beta',
    DEV = 'development',
}

export const isLightdashMode = (x: string): x is LightdashMode =>
    Object.values<string>(LightdashMode).includes(x);

export enum LightdashInstallType {
    DOCKER_IMAGE = 'docker_image',
    BASH_INSTALL = 'bash_install',
    HEROKU = 'heroku',
    UNKNOWN = 'unknown',
}

export type HealthState = {
    healthy: boolean;
    mode: LightdashMode;
    version: string;
    localDbtEnabled: boolean;
    defaultProject?: DbtProjectConfig;
    isAuthenticated: boolean;
    requiresOrgRegistration: boolean;
    hasEmailClient: boolean;
    latest: {
        version?: string;
    };
    rudder: {
        writeKey: string;
        dataPlaneUrl: string;
    };
    sentry: {
        dsn: string;
        environment: string;
        release: string;
    };
    intercom: {
        appId: string;
        apiBase: string;
    };

    fullstory: {
        orgId: string;
        devMode: boolean;
    };
    auth: {
        disablePasswordAuthentication: boolean;
        google: {
            oauth2ClientId: string | undefined;
            loginPath: string;
        };
        okta: {
            enabled: boolean;
            loginPath: string;
        };
        oneLogin: {
            enabled: boolean;
            loginPath: string;
        };
    };
    cohere: {
        token: string;
    };
    siteUrl: string;
    staticIp: string;
    query: {
        maxLimit: number;
        csvCellsLimit: number;
    };
    hasSlack: boolean;
    hasHeadlessBrowser: boolean;
};

export enum DBFieldTypes {
    DIMENSION = 'dimension',
    METRIC = 'metric',
}

export const sensitiveDbtCredentialsFieldNames = [
    'personal_access_token',
    'api_key',
] as const;

export const DbtProjectTypeLabels: Record<DbtProjectType, string> = {
    [DbtProjectType.DBT]: 'dbt local server',
    [DbtProjectType.DBT_CLOUD_IDE]: 'dbt cloud',
    [DbtProjectType.GITHUB]: 'Github',
    [DbtProjectType.GITLAB]: 'GitLab',
    [DbtProjectType.BITBUCKET]: 'BitBucket',
    [DbtProjectType.AZURE_DEVOPS]: 'Azure DevOps',
    [DbtProjectType.NONE]: 'CLI',
};

export type CreateProject = Omit<
    Project,
    'projectUuid' | 'organizationUuid'
> & {
    warehouseConnection: CreateWarehouseCredentials;
};

export type UpdateProject = Omit<
    Project,
    'projectUuid' | 'organizationUuid' | 'type'
> & {
    warehouseConnection: CreateWarehouseCredentials;
};

export const getResultValues = (
    rows: ResultRow[],
    onlyRaw: boolean = false,
): { [col: string]: any }[] =>
    rows.map((row: ResultRow) =>
        Object.keys(row).reduce((acc, key) => {
            const value: string = onlyRaw
                ? row[key]?.value?.raw
                : row[key]?.value?.formatted || row[key]?.value?.raw;

            return { ...acc, [key]: value };
        }, {}),
    );

export const getAxisName = ({
    isAxisTheSameForAllSeries,
    selectedAxisIndex,
    axisReference,
    axisIndex,
    axisName,
    series,
    items,
}: {
    isAxisTheSameForAllSeries: boolean;
    selectedAxisIndex: number;
    axisReference: 'yRef' | 'xRef';
    axisIndex: number;
    axisName?: string;
    series?: Series[];
    items: Array<Field | TableCalculation>;
}): string | undefined => {
    const defaultItem = items.find(
        (item) =>
            getItemId(item) === (series || [])[0]?.encode[axisReference].field,
    );
    const fallbackSeriesName: string | undefined =
        series && series.length === 1
            ? series[0].name ||
              (defaultItem && getItemLabelWithoutTableName(defaultItem))
            : undefined;
    return !isAxisTheSameForAllSeries || selectedAxisIndex === axisIndex
        ? axisName || fallbackSeriesName
        : undefined;
};

export function getFieldMap(
    explore: Explore,
    additionalMetrics: AdditionalMetric[] = [],
): Record<string, CompiledField | AdditionalMetric> {
    return [...getFields(explore), ...additionalMetrics].reduce(
        (sum, field) => ({
            ...sum,
            [fieldId(field)]: field,
        }),
        {},
    );
}

export function getItemMap(
    explore: Explore,
    additionalMetrics: AdditionalMetric[] = [],
    tableCalculations: TableCalculation[] = [],
): Record<string, Field | TableCalculation> {
    const convertedAdditionalMetrics = (additionalMetrics || []).reduce<
        Metric[]
    >((acc, additionalMetric) => {
        const table = explore.tables[additionalMetric.table];
        if (table) {
            const metric = convertAdditionalMetric({
                additionalMetric,
                table,
            });
            return [...acc, metric];
        }
        return acc;
    }, []);
    return [
        ...getFields(explore),
        ...convertedAdditionalMetrics,
        ...tableCalculations,
    ].reduce(
        (acc, item) => ({
            ...acc,
            [isAdditionalMetric(item) ? fieldId(item) : getItemId(item)]: item,
        }),
        {},
    );
}

export function itemsInMetricQuery(
    metricQuery: MetricQuery | undefined,
): string[] {
    return metricQuery === undefined
        ? []
        : [
              ...metricQuery.metrics,
              ...metricQuery.dimensions,
              ...(metricQuery.tableCalculations || []).map((tc) => tc.name),
          ];
}

export function formatRows(
    rows: { [col: string]: any }[],
    itemMap: Record<string, Field | TableCalculation>,
): ResultRow[] {
    return rows.map((row) =>
        Object.keys(row).reduce((acc, columnName) => {
            const col = row[columnName];

            const item = itemMap[columnName];
            return {
                ...acc,
                [columnName]: {
                    value: {
                        raw: col,
                        formatted: formatItemValue(item, col),
                    },
                },
            };
        }, {}),
    );
}

const isObject = (object: any) => object != null && typeof object === 'object';
export const removeEmptyProperties = (object: Record<string, any>) => {
    const newObj: Record<string, any> = {};
    Object.keys(object).forEach((key) => {
        if (object[key] === Object(object[key]))
            newObj[key] = removeEmptyProperties(object[key]);
        else if (object[key] !== undefined && object[key] !== null)
            newObj[key] = object[key];
    });
    return newObj;
};
export const deepEqual = (
    object1: Record<string, any>,
    object2: Record<string, any>,
): boolean => {
    const keys1 = Object.keys(object1);
    const keys2 = Object.keys(object2);
    if (keys1.length !== keys2.length) {
        return false;
    }
    return keys1.every((key) => {
        const val1: any = object1[key];
        const val2: any = object2[key];
        const areObjects = isObject(val1) && isObject(val2);
        return !(
            (areObjects && !deepEqual(val1, val2)) ||
            (!areObjects && val1 !== val2)
        );
    });
};

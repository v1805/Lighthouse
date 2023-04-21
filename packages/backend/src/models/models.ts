import { lightdashConfig } from '../config/lightdashConfig';
import database from '../database/database';
import { EncryptionService } from '../services/EncryptionService/EncryptionService';
import { AnalyticsModel } from './AnalyticsModel';
import { DashboardModel } from './DashboardModel/DashboardModel';
import { PersonalAccessTokenModel } from './DashboardModel/PersonalAccessTokenModel';
import { DbtCloudMetricsModel } from './DbtCloudMetricsModel';
import { EmailModel } from './EmailModel';
import { InviteLinkModel } from './InviteLinkModel';
import { JobModel } from './JobModel/JobModel';
import { OnboardingModel } from './OnboardingModel/OnboardingModel';
import { OpenIdIdentityModel } from './OpenIdIdentitiesModel';
import { OrganizationAllowedEmailDomainsModel } from './OrganizationAllowedEmailDomainsModel';
import { OrganizationMemberProfileModel } from './OrganizationMemberProfileModel';
import { OrganizationModel } from './OrganizationModel';
import { PasswordResetLinkModel } from './PasswordResetLinkModel';
import { PinnedListModel } from './PinnedListModel';
import { ProjectModel } from './ProjectModel/ProjectModel';
import { SavedChartModel } from './SavedChartModel';
import { SchedulerModel } from './SchedulerModel';
import { SearchModel } from './SearchModel';
import { SessionModel } from './SessionModel';
import { ShareModel } from './ShareModel';
import { SlackAuthenticationModel } from './SlackAuthenticationModel';
import { SpaceModel } from './SpaceModel';
import { UserModel } from './UserModel';

export const encryptionService = new EncryptionService({ lightdashConfig });

export const inviteLinkModel = new InviteLinkModel(database);
export const organizationModel = new OrganizationModel(database);
export const userModel = new UserModel(database);
export const sessionModel = new SessionModel(database);
export const dashboardModel = new DashboardModel({ database });
export const projectModel = new ProjectModel({
    database,
    lightdashConfig,
    encryptionService,
});
export const onboardingModel = new OnboardingModel({ database });
export const emailModel = new EmailModel({ database });
export const openIdIdentityModel = new OpenIdIdentityModel({ database });
export const passwordResetLinkModel = new PasswordResetLinkModel({
    database,
    lightdashConfig,
});
export const organizationMemberProfileModel =
    new OrganizationMemberProfileModel({ database });
export const savedChartModel = new SavedChartModel({ database });
export const jobModel = new JobModel({ database });
export const personalAccessTokenModel = new PersonalAccessTokenModel({
    database,
});
export const spaceModel = new SpaceModel({
    database,
});
export const searchModel = new SearchModel({
    database,
});
export const dbtCloudMetricsModel = new DbtCloudMetricsModel();

export const shareModel = new ShareModel({
    database,
});

export const slackAuthenticationModel = new SlackAuthenticationModel({
    database,
});

export const analyticsModel = new AnalyticsModel({
    database,
});
export const pinnedListModel = new PinnedListModel({ database });

export const schedulerModel = new SchedulerModel({ database });

export const organizationAllowedEmailDomainsModel =
    new OrganizationAllowedEmailDomainsModel({ database });

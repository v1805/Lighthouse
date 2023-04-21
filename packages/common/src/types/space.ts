import { DashboardBasicDetails } from './dashboard';
import { ProjectMemberRole } from './projectMemberProfile';
import { SpaceQuery } from './savedCharts';

export type Space = {
    organizationUuid: string;
    uuid: string;
    name: string;
    isPrivate: boolean;
    queries: SpaceQuery[];
    projectUuid: string;
    dashboards: DashboardBasicDetails[];
    access: SpaceShare[];
    pinnedListUuid: string | null;
};

export type CreateSpace = Pick<Space, 'name' | 'isPrivate' | 'access'>;

export type UpdateSpace = Pick<Space, 'name' | 'isPrivate'>;

export type SpaceShare = {
    userUuid: string;
    firstName: string;
    lastName: string;
    role: ProjectMemberRole | null;
};

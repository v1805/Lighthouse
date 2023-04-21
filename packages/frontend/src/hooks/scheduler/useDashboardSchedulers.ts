import {
    ApiError,
    CreateSchedulerAndTargetsWithoutIds,
    SchedulerAndTargets,
} from '@lightdash/common';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { lightdashApi } from '../../api';
import useToaster from '../toaster/useToaster';

const getDashboardSchedulers = async (uuid: string) =>
    lightdashApi<SchedulerAndTargets[]>({
        url: `/dashboards/${uuid}/schedulers`,
        method: 'GET',
        body: undefined,
    });

export const useDashboardSchedulers = (dashboardUuid: string) =>
    useQuery<SchedulerAndTargets[], ApiError>({
        queryKey: ['dashboard_schedulers', dashboardUuid],
        queryFn: () => getDashboardSchedulers(dashboardUuid),
    });

const createDashboardScheduler = async (
    uuid: string,
    data: CreateSchedulerAndTargetsWithoutIds,
) =>
    lightdashApi<SchedulerAndTargets>({
        url: `/dashboards/${uuid}/schedulers`,
        method: 'POST',
        body: JSON.stringify(data),
    });

export const useDashboardSchedulerCreateMutation = () => {
    const queryClient = useQueryClient();
    const { showToastSuccess, showToastError } = useToaster();
    return useMutation<
        SchedulerAndTargets,
        ApiError,
        { resourceUuid: string; data: CreateSchedulerAndTargetsWithoutIds }
    >(
        ({ resourceUuid, data }) =>
            createDashboardScheduler(resourceUuid, data),
        {
            mutationKey: ['create_dashboard_scheduler'],
            onSuccess: async (_, variables) => {
                await queryClient.invalidateQueries([
                    'dashboard_schedulers',
                    variables.resourceUuid,
                ]);
                showToastSuccess({
                    title: `Success! Scheduled delivery was created.`,
                });
            },
            onError: (error) => {
                showToastError({
                    title: `Failed to create scheduled delivery`,
                    subtitle: error.error.message,
                });
            },
        },
    );
};

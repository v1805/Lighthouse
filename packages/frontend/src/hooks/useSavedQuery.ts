import {
    ApiError,
    CreateSavedChart,
    CreateSavedChartVersion,
    SavedChart,
    UpdateMultipleSavedChart,
    UpdateSavedChart,
} from '@lightdash/common';
import {
    useMutation,
    useQuery,
    useQueryClient,
    UseQueryOptions,
} from 'react-query';
import { useHistory, useParams } from 'react-router-dom';
import { lightdashApi } from '../api';
import useToaster from './toaster/useToaster';
import useSearchParams from './useSearchParams';

const createSavedQuery = async (
    projectUuid: string,
    payload: CreateSavedChart,
): Promise<SavedChart> =>
    lightdashApi<SavedChart>({
        url: `/projects/${projectUuid}/saved`,
        method: 'POST',
        body: JSON.stringify(payload),
    });

const duplicateSavedQuery = async (
    projectUuid: string,
    chartUuid: string,
): Promise<SavedChart> =>
    lightdashApi<SavedChart>({
        url: `/projects/${projectUuid}/saved?duplicateFrom=${chartUuid}`,
        method: 'POST',
        body: undefined,
    });

const deleteSavedQuery = async (id: string) =>
    lightdashApi<undefined>({
        url: `/saved/${id}`,
        method: 'DELETE',
        body: undefined,
    });

const updateSavedQuery = async (
    id: string,
    data: UpdateSavedChart,
): Promise<SavedChart> => {
    return lightdashApi<SavedChart>({
        url: `/saved/${id}`,
        method: 'PATCH',
        body: JSON.stringify({
            name: data.name,
            description: data.description,
            spaceUuid: data.spaceUuid,
        }),
    });
};

const getSavedQuery = async (id: string): Promise<SavedChart> =>
    lightdashApi<SavedChart>({
        url: `/saved/${id}`,
        method: 'GET',
        body: undefined,
    });

const addVersionSavedQuery = async ({
    uuid,
    payload,
}: {
    uuid: string;
    payload: CreateSavedChartVersion;
}): Promise<SavedChart> =>
    lightdashApi<SavedChart>({
        url: `/saved/${uuid}/version`,
        method: 'POST',
        body: JSON.stringify(payload),
    });

interface Args {
    id?: string;
    useQueryOptions?: UseQueryOptions<SavedChart, ApiError>;
}

export const useSavedQuery = ({ id, useQueryOptions }: Args = {}) =>
    useQuery<SavedChart, ApiError>({
        queryKey: ['saved_query', id],
        queryFn: () => getSavedQuery(id || ''),
        enabled: id !== undefined,
        retry: false,
        ...useQueryOptions,
    });

export const useSavedQueryDeleteMutation = () => {
    const queryClient = useQueryClient();
    const { showToastSuccess, showToastError } = useToaster();
    return useMutation<undefined, ApiError, string>(deleteSavedQuery, {
        mutationKey: ['saved_query_create'],
        onSuccess: async () => {
            await queryClient.invalidateQueries('spaces');
            await queryClient.invalidateQueries('space');

            showToastSuccess({
                title: `Success! Chart was deleted.`,
            });
        },
        onError: (error) => {
            showToastError({
                title: `Failed to delete chart`,
                subtitle: error.error.message,
            });
        },
    });
};

const updateMultipleSavedQuery = async (
    projectUuid: string,
    data: UpdateMultipleSavedChart[],
): Promise<SavedChart[]> => {
    return lightdashApi<SavedChart[]>({
        url: `/projects/${projectUuid}/saved`,
        method: 'PATCH',
        body: JSON.stringify(data),
    });
};

export const useUpdateMultipleMutation = (projectUuid: string) => {
    const queryClient = useQueryClient();
    const { showToastSuccess, showToastError } = useToaster();

    return useMutation<SavedChart[], ApiError, UpdateMultipleSavedChart[]>(
        (data) => {
            return updateMultipleSavedQuery(projectUuid, data);
        },
        {
            mutationKey: ['saved_query_multiple_update'],
            onSuccess: async (data) => {
                await queryClient.invalidateQueries(['space', projectUuid]);
                await queryClient.invalidateQueries('spaces');
                data.forEach((savedChart) => {
                    queryClient.setQueryData(
                        ['saved_query', savedChart.uuid],
                        savedChart,
                    );
                });
                showToastSuccess({
                    title: `Success! Charts were updated.`,
                });
            },
            onError: (error) => {
                showToastError({
                    title: `Failed to save chart`,
                    subtitle: error.error.message,
                });
            },
        },
    );
};

export const useUpdateMutation = (
    dashboardUuid?: string,
    savedQueryUuid?: string,
) => {
    const history = useHistory();
    const queryClient = useQueryClient();
    const { showToastSuccess, showToastError } = useToaster();

    return useMutation<SavedChart, ApiError, UpdateSavedChart>(
        (data) => {
            if (savedQueryUuid) {
                return updateSavedQuery(savedQueryUuid, data);
            }
            throw new Error('Saved chart ID is undefined');
        },
        {
            mutationKey: ['saved_query_create'],
            onSuccess: async (data) => {
                await queryClient.invalidateQueries([
                    'space',
                    data.projectUuid,
                ]);

                await queryClient.invalidateQueries('spaces');
                queryClient.setQueryData(['saved_query', data.uuid], data);
                showToastSuccess({
                    title: `Success! Chart was saved.`,
                    action: dashboardUuid
                        ? {
                              text: 'Open dashboard',
                              icon: 'arrow-right',
                              onClick: () =>
                                  history.push(
                                      `/projects/${data.projectUuid}/dashboards/${dashboardUuid}`,
                                  ),
                          }
                        : undefined,
                });
            },
            onError: (error) => {
                showToastError({
                    title: `Failed to save chart`,
                    subtitle: error.error.message,
                });
            },
        },
    );
};

export const useMoveChartMutation = () => {
    const history = useHistory();
    const queryClient = useQueryClient();
    const { projectUuid } = useParams<{ projectUuid: string }>();
    const { showToastSuccess, showToastError } = useToaster();

    return useMutation<
        SavedChart,
        ApiError,
        Pick<SavedChart, 'uuid' | 'name' | 'spaceUuid'>
    >(
        ({ uuid, name, spaceUuid }) =>
            updateSavedQuery(uuid, { name, spaceUuid }),
        {
            mutationKey: ['saved_query_move'],
            onSuccess: async (data) => {
                await queryClient.invalidateQueries('spaces');
                await queryClient.invalidateQueries(['space', projectUuid]);

                queryClient.setQueryData(['saved_query', data.uuid], data);
                showToastSuccess({
                    title: `Chart has been moved to ${data.spaceName}`,
                    action: {
                        text: 'Go to space',
                        icon: 'arrow-right',
                        onClick: () =>
                            history.push(
                                `/projects/${projectUuid}/spaces/${data.spaceUuid}`,
                            ),
                    },
                });
            },
            onError: (error) => {
                showToastError({
                    title: `Failed to move chart`,
                    subtitle: error.error.message,
                });
            },
        },
    );
};

export const useCreateMutation = () => {
    const history = useHistory();
    const { projectUuid } = useParams<{ projectUuid: string }>();
    const queryClient = useQueryClient();
    const { showToastSuccess, showToastError } = useToaster();
    return useMutation<SavedChart, ApiError, CreateSavedChart>(
        (data) => createSavedQuery(projectUuid, data),
        {
            mutationKey: ['saved_query_create', projectUuid],
            onSuccess: (data) => {
                queryClient.setQueryData(['saved_query', data.uuid], data);
                showToastSuccess({
                    title: `Success! Chart was saved.`,
                });
                history.push({
                    pathname: `/projects/${projectUuid}/saved/${data.uuid}/view`,
                });
            },
            onError: (error) => {
                showToastError({
                    title: `Failed to save chart`,
                    subtitle: error.error.message,
                });
            },
        },
    );
};

type DuplicateChartMutationOptions = {
    showRedirectButton?: boolean;
};

export const useDuplicateChartMutation = (
    options?: DuplicateChartMutationOptions,
) => {
    const history = useHistory();
    const { projectUuid } = useParams<{ projectUuid: string }>();
    const queryClient = useQueryClient();
    const { showToastSuccess, showToastError } = useToaster();
    return useMutation<SavedChart, ApiError, SavedChart['uuid']>(
        (chartUuid) => duplicateSavedQuery(projectUuid, chartUuid),
        {
            mutationKey: ['saved_query_create', projectUuid],
            onSuccess: async (data) => {
                await queryClient.invalidateQueries('spaces');
                await queryClient.invalidateQueries(['space', projectUuid]);

                if (!options?.showRedirectButton) {
                    history.push({
                        pathname: `/projects/${projectUuid}/saved/${data.uuid}`,
                    });
                }

                showToastSuccess({
                    title: `Chart successfully duplicated!`,
                    action: options?.showRedirectButton
                        ? {
                              text: 'Open chart',
                              icon: 'arrow-right',
                              onClick: () =>
                                  history.push(
                                      `/projects/${projectUuid}/saved/${data.uuid}`,
                                  ),
                          }
                        : undefined,
                });
            },
            onError: (error) => {
                showToastError({
                    title: `Failed to duplicate chart`,
                    subtitle: error.error.message,
                });
            },
        },
    );
};

export const useAddVersionMutation = () => {
    const history = useHistory();
    const queryClient = useQueryClient();
    const dashboardUuid = useSearchParams('fromDashboard');

    const { showToastSuccess, showToastError } = useToaster();
    return useMutation<
        SavedChart,
        ApiError,
        { uuid: string; payload: CreateSavedChartVersion }
    >(addVersionSavedQuery, {
        mutationKey: ['saved_query_version'],
        onSuccess: async (data) => {
            await queryClient.invalidateQueries('spaces');

            queryClient.setQueryData(['saved_query', data.uuid], data);

            if (dashboardUuid)
                showToastSuccess({
                    title: `Success! Chart was updated.`,
                    action: {
                        text: 'Open dashboard',
                        icon: 'arrow-right',
                        onClick: () =>
                            history.push(
                                `/projects/${data.projectUuid}/dashboards/${dashboardUuid}`,
                            ),
                    },
                });
            else {
                showToastSuccess({
                    title: `Success! Chart was updated.`,
                });
                history.push({
                    pathname: `/projects/${data.projectUuid}/saved/${data.uuid}/view`,
                });
            }
        },
        onError: (error) => {
            showToastError({
                title: `Failed to update chart`,
                subtitle: error.error.message,
            });
        },
    });
};

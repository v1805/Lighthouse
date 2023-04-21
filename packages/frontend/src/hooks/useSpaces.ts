import { ApiError, CreateSpace, Space, UpdateSpace } from '@lightdash/common';
import {
    useMutation,
    useQuery,
    useQueryClient,
    UseQueryOptions,
} from 'react-query';
import { lightdashApi } from '../api';
import useToaster from './toaster/useToaster';

const getSpaces = async (projectUuid: string) =>
    lightdashApi<Space[]>({
        url: `/projects/${projectUuid}/spaces`,
        method: 'GET',
        body: undefined,
    });

export const useSpaces = (
    projectUuid: string,
    queryOptions?: UseQueryOptions<Space[], ApiError>,
) => {
    return useQuery<Space[], ApiError>(
        ['spaces', projectUuid],
        () => getSpaces(projectUuid),
        { ...queryOptions },
    );
};

export const useSavedCharts = (projectUuid: string) => {
    const spaces = useSpaces(projectUuid);
    const allCharts = spaces.data?.flatMap((space) => space.queries);
    return { ...spaces, data: allCharts };
};

const getSpace = async (projectUuid: string, spaceUuid: string) =>
    lightdashApi<Space>({
        url: `/projects/${projectUuid}/spaces/${spaceUuid}`,
        method: 'GET',
        body: undefined,
    });

export const useSpace = (
    projectUuid: string,
    spaceUuid: string,
    useQueryOptions?: UseQueryOptions<Space, ApiError>,
) =>
    useQuery<Space, ApiError>({
        queryKey: ['space', projectUuid, spaceUuid],
        queryFn: () => getSpace(projectUuid, spaceUuid),
        ...useQueryOptions,
    });

const deleteQuery = async (projectUuid: string, spaceUuid: string) =>
    lightdashApi<undefined>({
        url: `/projects/${projectUuid}/spaces/${spaceUuid}`,
        method: 'DELETE',
        body: undefined,
    });

export const useSpaceDeleteMutation = (projectUuid: string) => {
    const { showToastSuccess, showToastError } = useToaster();
    const queryClient = useQueryClient();

    return useMutation<undefined, ApiError, string>(
        (spaceUuid) => deleteQuery(projectUuid, spaceUuid),
        {
            mutationKey: ['space_delete', projectUuid],
            onSuccess: async () => {
                await queryClient.refetchQueries(['spaces', projectUuid]);
                showToastSuccess({
                    title: `Success! Space was deleted.`,
                });
            },
            onError: (error) => {
                showToastError({
                    title: `Failed to delete space`,
                    subtitle: error.error.message,
                });
            },
        },
    );
};

const updateSpace = async (
    projectUuid: string,
    spaceUuid: string,
    data: UpdateSpace,
) =>
    lightdashApi<Space>({
        url: `/projects/${projectUuid}/spaces/${spaceUuid}`,
        method: 'PATCH',
        body: JSON.stringify(data),
    });

export const useUpdateMutation = (projectUuid: string, spaceUuid: string) => {
    const { showToastSuccess, showToastError } = useToaster();
    const queryClient = useQueryClient();

    return useMutation<Space, ApiError, UpdateSpace>(
        (data) => updateSpace(projectUuid, spaceUuid, data),
        {
            mutationKey: ['space_update', projectUuid],
            onSuccess: async (data) => {
                await queryClient.refetchQueries(['spaces', projectUuid]);
                queryClient.setQueryData(
                    ['space', projectUuid, spaceUuid],
                    data,
                );

                showToastSuccess({
                    title: `Success! Space was updated.`,
                });
            },
            onError: (error) => {
                showToastError({
                    title: `Failed to update space`,
                    subtitle: error.error.message,
                });
            },
        },
    );
};

const createSpace = async (projectUuid: string, data: CreateSpace) =>
    lightdashApi<Space>({
        url: `/projects/${projectUuid}/spaces/`,
        method: 'POST',
        body: JSON.stringify(data),
    });

export const useCreateMutation = (
    projectUuid: string,
    options?: {
        onSuccess?: (space: Space) => void;
    },
) => {
    const { showToastSuccess, showToastError } = useToaster();
    const queryClient = useQueryClient();

    return useMutation<Space, ApiError, CreateSpace>(
        (data) => createSpace(projectUuid, data),
        {
            mutationKey: ['space_create', projectUuid],
            onSuccess: async (space) => {
                await queryClient.refetchQueries(['spaces', projectUuid]);

                options?.onSuccess?.(space);

                showToastSuccess({
                    title: `Success! Space was created.`,
                });
            },
            onError: (error) => {
                showToastError({
                    title: `Failed to create space`,
                    subtitle: error.error.message,
                });
            },
        },
    );
};

const addSpaceShare = async (
    projectUuid: string,
    spaceUuid: string,
    userUuid: string,
) =>
    lightdashApi<Space>({
        url: `/projects/${projectUuid}/spaces/${spaceUuid}/share`,
        method: 'POST',
        body: JSON.stringify({ userUuid }),
    });

export const useAddSpaceShareMutation = (
    projectUuid: string,
    spaceUuid: string,
) => {
    const { showToastSuccess, showToastError } = useToaster();
    const queryClient = useQueryClient();

    return useMutation<Space, ApiError, string>(
        (userUuid) => addSpaceShare(projectUuid, spaceUuid, userUuid),
        {
            mutationKey: ['space_share', projectUuid, spaceUuid],
            onSuccess: async (space) => {
                await queryClient.refetchQueries(['spaces', projectUuid]);
                await queryClient.refetchQueries([
                    'space',
                    projectUuid,
                    spaceUuid,
                ]);

                showToastSuccess({
                    title: `Success! Space was shared.`,
                });
            },
            onError: (error) => {
                showToastError({
                    title: `Failed to share space`,
                    subtitle: error.error.message,
                });
            },
        },
    );
};

const deleteSpaceShare = async (
    projectUuid: string,
    spaceUuid: string,
    userUuid: string,
) =>
    lightdashApi<undefined>({
        url: `/projects/${projectUuid}/spaces/${spaceUuid}/share/${userUuid}`,
        method: 'DELETE',
        body: undefined,
    });

export const useDeleteSpaceShareMutation = (
    projectUuid: string,
    spaceUuid: string,
) => {
    const { showToastSuccess, showToastError } = useToaster();
    const queryClient = useQueryClient();

    return useMutation<undefined, ApiError, string>(
        (userUuid) => deleteSpaceShare(projectUuid, spaceUuid, userUuid),
        {
            mutationKey: ['space_unshare', projectUuid, spaceUuid],
            onSuccess: async () => {
                await queryClient.refetchQueries(['spaces', projectUuid]);
                await queryClient.refetchQueries([
                    'space',
                    projectUuid,
                    spaceUuid,
                ]);

                showToastSuccess({
                    title: `Success! Space was unshared.`,
                });
            },
            onError: (error) => {
                showToastError({
                    title: `Failed to unshare space`,
                    subtitle: error.error.message,
                });
            },
        },
    );
};

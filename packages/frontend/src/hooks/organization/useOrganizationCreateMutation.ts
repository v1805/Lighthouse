import { ApiError, CreateOrganization } from '@lightdash/common';
import { useMutation, useQueryClient } from 'react-query';
import { lightdashApi } from '../../api';

const createOrgQuery = async (data: CreateOrganization) =>
    lightdashApi<undefined>({
        url: `/org`,
        method: 'PUT',
        body: JSON.stringify(data),
    });

export const useOrganizationCreateMutation = () => {
    const queryClient = useQueryClient();
    return useMutation<undefined, ApiError, CreateOrganization>(
        createOrgQuery,
        {
            mutationKey: ['organization_create'],
            onSuccess: async () => {
                await queryClient.invalidateQueries(['user']);
            },
        },
    );
};

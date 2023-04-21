import { ApiError, EmailStatusExpiring } from '@lightdash/common';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { lightdashApi } from '../api';
import useToaster from './toaster/useToaster';

export const getEmailStatusQuery = async () => {
    return lightdashApi<EmailStatusExpiring>({
        url: `/user/me/email/status`,
        method: 'GET',
        body: undefined,
    });
};

export const sendOneTimePasscodeQuery = async () => {
    return lightdashApi<EmailStatusExpiring>({
        url: `/user/me/email/otp`,
        method: 'PUT',
        body: undefined,
    });
};

export const verifyOTPQuery = async (code: string) => {
    return lightdashApi<EmailStatusExpiring>({
        url: `/user/me/email/status?passcode=${code}`,
        method: 'GET',
        body: undefined,
    });
};

export const useEmailStatus = (enabled = true) =>
    useQuery<EmailStatusExpiring, ApiError>({
        queryKey: ['email_status'],
        queryFn: () => getEmailStatusQuery(),
        enabled,
    });

export const useOneTimePassword = () => {
    const queryClient = useQueryClient();
    const { showToastSuccess, showToastError } = useToaster();
    return useMutation<EmailStatusExpiring, ApiError>(
        () => sendOneTimePasscodeQuery(),
        {
            mutationKey: ['send_verification_email'],
            onSuccess: async () => {
                await queryClient.invalidateQueries('email_status');
            },
            onError: (error) => {
                showToastError({
                    title: `We couldn't send a verification e-mail to your inbox.`,
                    subtitle: error.error.message,
                });
            },
        },
    );
};

export const useVerifyEmail = () => {
    const queryClient = useQueryClient();
    const { showToastSuccess } = useToaster();
    return useMutation<EmailStatusExpiring, ApiError, string>(
        (code) => verifyOTPQuery(code),
        {
            mutationKey: ['verify_one_time_password'],
            onSuccess: async (data) => {
                await queryClient.invalidateQueries(['email_status']);

                if (data.isVerified)
                    showToastSuccess({
                        title: 'Success! Your e-mail has been verified.',
                    });
            },
        },
    );
};

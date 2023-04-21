import { ApiError, CreateUserArgs, LightdashUser } from '@lightdash/common';
import { Anchor, Card, Image, Stack, Text, Title } from '@mantine/core';
import React, { FC } from 'react';
import { Helmet } from 'react-helmet';
import { useMutation } from 'react-query';
import { useLocation } from 'react-router-dom';
import { lightdashApi } from '../api';
import {
    GoogleLoginButton,
    OktaLoginButton,
    OneLoginLoginButton,
} from '../components/common/GoogleLoginButton';
import Page from '../components/common/Page/Page';
import PageSpinner from '../components/PageSpinner';
import CreateUserForm from '../components/RegisterForms/CreateUserForm';
import useToaster from '../hooks/toaster/useToaster';
import { useApp } from '../providers/AppProvider';
import { useTracking } from '../providers/TrackingProvider';
import LightdashLogo from '../svgs/lightdash-black.svg';
import { Divider, DividerWrapper } from './Invite.styles';

const registerQuery = async (data: CreateUserArgs) =>
    lightdashApi<LightdashUser>({
        url: `/register`,
        method: 'POST',
        body: JSON.stringify(data),
    });

const Register: FC = () => {
    const location = useLocation<{ from?: Location } | undefined>();
    const { health } = useApp();
    const { showToastError } = useToaster();
    const allowPasswordAuthentication =
        !health.data?.auth.disablePasswordAuthentication;
    const { identify } = useTracking();
    const { isLoading, mutate, isSuccess } = useMutation<
        LightdashUser,
        ApiError,
        CreateUserArgs
    >(registerQuery, {
        mutationKey: ['login'],
        onSuccess: (data) => {
            identify({ id: data.userUuid });
            window.location.href = location.state?.from
                ? `${location.state.from.pathname}${location.state.from.search}`
                : '/';
        },
        onError: (error) => {
            showToastError({
                title: `Failed to create user`,
                subtitle: error.error.message,
            });
        },
    });

    if (health.isLoading) {
        return <PageSpinner />;
    }

    const ssoAvailable =
        !!health.data?.auth.google.oauth2ClientId ||
        health.data?.auth.okta.enabled ||
        health.data?.auth.oneLogin.enabled;
    const ssoLogins = ssoAvailable && (
        <>
            {health.data?.auth.google.oauth2ClientId && <GoogleLoginButton />}
            {health.data?.auth.okta.enabled && <OktaLoginButton />}
            {health.data?.auth.oneLogin.enabled && <OneLoginLoginButton />}
        </>
    );
    const passwordLogin = allowPasswordAuthentication && (
        <CreateUserForm
            isLoading={isLoading || isSuccess}
            onSubmit={(data: CreateUserArgs) => {
                mutate(data);
            }}
        />
    );
    const logins = (
        <>
            {ssoLogins}
            {ssoLogins && passwordLogin && (
                <DividerWrapper>
                    <Divider />
                    <b>OR</b>
                    <Divider />
                </DividerWrapper>
            )}
            {passwordLogin}
        </>
    );
    return (
        <Page isFullHeight>
            <Helmet>
                <title>Register - Lighthouse</title>
            </Helmet>

            {/* FIXME: use Mantine sizes for width */}
            <Stack w={400} mt="4xl">
                <Image
                    src={LightdashLogo}
                    alt="lightdash logo"
                    width={130}
                    mx="auto"
                    my="lg"
                />
                <Card p="xl" radius="xs" withBorder shadow="xs">
                    <Title order={3} ta="center" mb="md">
                        Sign up
                    </Title>
                    {logins}
                </Card>
                <Text color="gray.6" ta="center">
                    By creating an account, you agree to
                    <br />
                    our{' '}
                    <Anchor
                        href="https://www.lightdash.com/privacy-policy"
                        target="_blank"
                    >
                        Privacy Policy
                    </Anchor>{' '}
                    and our{' '}
                    <Anchor
                        href="https://www.lightdash.com/terms-of-service"
                        target="_blank"
                    >
                        Terms of Service.
                    </Anchor>
                </Text>
            </Stack>
        </Page>
    );
};

export default Register;

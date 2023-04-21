import {
    ApiError,
    CreateOrganizationUser,
    CreateUserArgs,
    LightdashUser,
} from '@lightdash/common';
import { Anchor, Button, Card, Image, Stack, Text, Title } from '@mantine/core';
import React, { FC, useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useMutation } from 'react-query';
import { Redirect, useLocation, useParams } from 'react-router-dom';
import { lightdashApi } from '../api';
import {
    GoogleLoginButton,
    OktaLoginButton,
    OneLoginLoginButton,
} from '../components/common/GoogleLoginButton';
import Page from '../components/common/Page/Page';
import PageSpinner from '../components/PageSpinner';
import CreateUserForm from '../components/RegisterForms/CreateUserForm';
import { useOrganization } from '../hooks/organization/useOrganization';
import useToaster from '../hooks/toaster/useToaster';
import { useInviteLink } from '../hooks/useInviteLink';
import { useApp } from '../providers/AppProvider';
import { useTracking } from '../providers/TrackingProvider';
import LightdashLogo from '../svgs/lightdash-black.svg';
import { Divider, DividerWrapper } from './Invite.styles';

interface WelcomeCardProps {
    email: string | undefined;
    setReadyToJoin: (isReady: boolean) => void;
}

const WelcomeCard: FC<WelcomeCardProps> = ({ email, setReadyToJoin }) => {
    const { data: org } = useOrganization();

    return (
        <>
            <Card
                p="xl"
                radius="xs"
                withBorder
                shadow="xs"
                data-cy="welcome-user"
            >
                <Stack spacing="md" align="center">
                    <Title order={3}>You’ve been invited!</Title>
                    {email && (
                        <Text fw="600" size="md">
                            {email}
                        </Text>
                    )}
                    <Text color="gray.6" ta="center">
                        {`Your teammates ${
                            org?.name ? `at ${org.name}` : ''
                        } are using Lightdash to discover
                    and share data insights. Click on the link below within the
                    next 72 hours to join your team and start exploring your
                    data!`}
                    </Text>
                    <Button onClick={() => setReadyToJoin(true)}>
                        Join your team
                    </Button>
                </Stack>
            </Card>
            <Text color="gray.6" ta="center">
                {`Not ${email ? email : 'for you'}?`}
                <br />
                Ignore this invite link and contact your workspace admin.
            </Text>
        </>
    );
};

const ErrorCard: FC<{ title: string }> = ({ title }) => {
    return (
        <Card p="xl" radius="xs" withBorder shadow="xs" data-cy="welcome-user">
            <Stack spacing="md" align="center">
                <Title order={3}>{title}</Title>
                <Text color="gray.7" ta="center">
                    Please check with the person who shared it with you to see
                    if there’s a new link available.
                </Text>
            </Stack>
        </Card>
    );
};

const createUserQuery = async (data: CreateOrganizationUser) =>
    lightdashApi<LightdashUser>({
        url: `/user`,
        method: 'POST',
        body: JSON.stringify(data),
    });

const Invite: FC = () => {
    const { inviteCode } = useParams<{ inviteCode: string }>();
    const { health } = useApp();
    const { showToastError } = useToaster();
    const { search } = useLocation();
    const { identify } = useTracking();
    const [isLinkFromEmail, setIsLinkFromEmail] = useState<boolean>(false);
    const { isLoading, mutate, isSuccess } = useMutation<
        LightdashUser,
        ApiError,
        CreateOrganizationUser
    >(createUserQuery, {
        mutationKey: ['create_user'],
        onSuccess: (data) => {
            identify({ id: data.userUuid });
            window.location.href = '/';
        },
        onError: (error) => {
            showToastError({
                title: `Failed to create user`,
                subtitle: error.error.message,
            });
        },
    });
    const inviteLinkQuery = useInviteLink(inviteCode);

    const allowPasswordAuthentication =
        !health.data?.auth.disablePasswordAuthentication;

    useEffect(() => {
        const searchParams = new URLSearchParams(search);
        const fromParam = searchParams.get('from');
        if (fromParam === 'email') {
            setIsLinkFromEmail(true);
        }
    }, [search]);

    if (health.isLoading || inviteLinkQuery.isLoading) {
        return <PageSpinner />;
    }

    if (health.status === 'success' && health.data?.isAuthenticated) {
        return <Redirect to={{ pathname: '/' }} />;
    }

    const ssoAvailable =
        !!health.data?.auth.google.oauth2ClientId ||
        health.data?.auth.okta.enabled ||
        health.data?.auth.oneLogin.enabled;
    const ssoLogins = ssoAvailable && (
        <>
            {health.data?.auth.google.oauth2ClientId && (
                <GoogleLoginButton inviteCode={inviteCode} />
            )}
            {health.data?.auth.okta.enabled && (
                <OktaLoginButton inviteCode={inviteCode} />
            )}
            {health.data?.auth.oneLogin.enabled && (
                <OneLoginLoginButton inviteCode={inviteCode} />
            )}
        </>
    );
    const passwordLogin = allowPasswordAuthentication && (
        <CreateUserForm
            isLoading={isLoading || isSuccess}
            readOnlyEmail={inviteLinkQuery.data?.email}
            onSubmit={(data: CreateUserArgs) => {
                mutate({
                    inviteCode,
                    ...data,
                });
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
                {inviteLinkQuery.error ? (
                    <ErrorCard
                        title={
                            inviteLinkQuery.error.error.name === 'ExpiredError'
                                ? 'This invite link has expired 🙈'
                                : inviteLinkQuery.error.error.message
                        }
                    />
                ) : isLinkFromEmail ? (
                    <>
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
                    </>
                ) : (
                    <WelcomeCard
                        email={inviteLinkQuery.data?.email}
                        setReadyToJoin={setIsLinkFromEmail}
                    />
                )}
            </Stack>
        </Page>
    );
};

export default Invite;

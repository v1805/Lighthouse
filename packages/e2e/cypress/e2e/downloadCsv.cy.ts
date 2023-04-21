import { SEED_PROJECT } from '@lightdash/common';

// https://github.com/cypress-io/cypress-example-recipes/blob/f4ecf5ad74e79c5668d1608d36f6dc365fc3b473/examples/testing-dom__download/cypress/e2e/utils.js#L36
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const validateCsv = (csvFilename: string, content: string) => {
    const downloadsFolder = Cypress.config('downloadsFolder');
    const downloadedFilename = `${downloadsFolder}/${csvFilename}`;

    // ensure the file has been saved before trying to parse it
    cy.readFile(downloadedFilename).should((text) => {
        expect(text).to.contain(content);
    });
};

describe('Download CSV on SQL Runner', () => {
    beforeEach(() => {
        cy.login();

        cy.intercept(/.*\.csv/g, (req) => {
            req.destroy();
            window.location.href = '/';
        });
        cy.on('url:changed', (newUrl) => {
            if (newUrl.includes('.csv')) {
                window.location.href = '/';
            }
        });
    });

    it(
        'Should download CSV from table chart on SQL runner',
        { retries: 3, pageLoadTimeout: 1000 },
        () => {
            cy.visit(`/projects/${SEED_PROJECT.project_uuid}/sqlRunner`, {
                timeout: 60000,
            });

            const downloadUrl = `/api/v1/projects/${SEED_PROJECT.project_uuid}/sqlRunner/downloadCsv`;
            cy.intercept({
                method: 'POST',
                url: downloadUrl,
            }).as('apiDownloadCsv');

            cy.findByText('payments').click();
            cy.findAllByText('Run query').first().click();

            const find = ['Payment method', 'bank_transfer', 'credit_card'];
            find.forEach((text) => cy.findAllByText(text));
            cy.contains('Page 1 of 3');

            cy.findByText('Charts').parent().findByRole('button').click();
            cy.findByText('Bar chart').click(); // Change chart type
            cy.findByText('Table').click();

            cy.findByText('Export CSV').click();

            cy.wait('@apiDownloadCsv').then((interception) => {
                expect(interception?.response?.statusCode).to.eq(200);
                expect(interception?.response?.body.results).to.have.property(
                    'url',
                );
            });
            // TODO validateCsv
        },
    );
});

describe('Download CSV on Dashboards', () => {
    beforeEach(() => {
        cy.login();
        cy.visit(`/projects/${SEED_PROJECT.project_uuid}/dashboards`);
    });

    it('Should download a CSV from dashboard', () => {
        const downloadUrl = `/api/v1/projects/${SEED_PROJECT.project_uuid}/explores/payments/downloadCsv`;
        cy.intercept({
            method: 'POST',
            url: downloadUrl,
        }).as('apiDownloadCsv');

        // wiat for the dashboard to load
        cy.findByText('Loading dashboards').should('not.exist');

        cy.contains('a', 'Jaffle dashboard').click();

        cy.findAllByText('Loading chart').should('have.length', 0); // Finish loading

        cy.findAllByText('No chart available').should('have.length', 0);
        cy.findAllByText('No data available').should('have.length', 0);

        cy.get('thead th').should('have.length', 6); // Table chart
        cy.contains('Days since').trigger('mouseenter');

        cy.get('[icon="more"]').click();
        cy.findByText('Export CSV').click();
        cy.get('button').contains('Export CSV').click();

        cy.wait('@apiDownloadCsv').then((interception) => {
            expect(interception?.response?.statusCode).to.eq(200);

            expect(interception?.response?.body.results).to.have.property(
                'jobId',
            );
        });
    });
});

describe('Download CSV on Explore', () => {
    beforeEach(() => {
        cy.login();
        cy.visit(`/projects/${SEED_PROJECT.project_uuid}/tables`);
    });

    it('Should download CSV from results on Explore', () => {
        const downloadUrl = `/api/v1/projects/${SEED_PROJECT.project_uuid}/explores/orders/downloadCsv`;
        cy.intercept({
            method: 'POST',
            url: downloadUrl,
        }).as('apiDownloadCsv');

        // choose table and select fields
        cy.findByText('Orders').click();
        cy.findByText('First name').click();
        cy.findByText('Unique order count').click();

        // run query
        cy.get('button').contains('Run query').click();

        // wait for the chart to finish loading
        cy.findByText('Loading chart').should('not.exist');

        cy.findByText('Export CSV').click();
        cy.get('.bp4-popover2').contains('button', 'Export CSV').click();

        cy.wait('@apiDownloadCsv').then((interception) => {
            expect(interception?.response?.statusCode).to.eq(200);
            expect(interception?.response?.body.results).to.have.property(
                'jobId',
            );
        });
    });
    it('Should download CSV from table chart on Explore', () => {
        const downloadUrl = `/api/v1/projects/${SEED_PROJECT.project_uuid}/explores/orders/downloadCsv`;
        cy.intercept({
            method: 'POST',
            url: downloadUrl,
        }).as('apiDownloadCsv');
        // choose table and select fields
        cy.findByText('Orders').click();
        cy.findByText('First name').click();
        cy.findByText('Unique order count').click();

        // run query
        cy.get('button').contains('Run query').click();

        // open chart
        cy.findByText('Charts').parent().findByRole('button').click();
        // Close results
        cy.findByText('Results').parent().findByRole('button').click();
        // wait for the chart to finish loading
        cy.findByText('Loading chart').should('not.exist');

        // open chart menu and change chart type to Table
        cy.get('button').contains('Bar chart').click();
        cy.get('[role="menuitem"]').contains('Table').click();

        cy.findByText('Export CSV').click();
        cy.get('.bp4-popover2').contains('button', 'Export CSV').click();

        cy.wait('@apiDownloadCsv').then((interception) => {
            expect(interception?.response?.statusCode).to.eq(200);

            expect(interception?.response?.body.results).to.have.property(
                'jobId',
            );
        });
    });
});

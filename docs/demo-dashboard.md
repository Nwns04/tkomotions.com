# Demo dashboard samples

The authenticated TKO Properties dashboard automatically inserts six fictional sample leads on its first successful data load. Two sample viewing requests and two sample follow-up tasks make the overview useful for demonstrations. Rows use the source Demo sample; contact fields are empty, bookings remain REQUESTED, and no notifications are sent.

The seed uses deterministic IDs scoped to the fictional business and set-on-insert updates. Refreshing or restarting does not duplicate data or overwrite records, including changes made to sample leads. Existing visitor enquiries are retained. The API checks staff authentication before accessing or seeding dashboard records.

Run npm run test:demo-dashboard and the TypeScript check before modifying the seed. After deployment, sign in through Finance and open /lead-dashboard to initialize and view the samples.

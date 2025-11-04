import { Inngest } from "inngest";

// Create a client to send and receive events
export const inngest = new Inngest({ id: "project-management" });

// create user in database when created in clerk
const syncUserCreation = inngest.createFunction(
    {id: "sync-user-from-clerk"},
    {event: "clerk/user.created"},
    async ({event}) => {
        const {data} = event;
        await prisma.user.create({
            data: {
                id: data.id,
                email: data.email_addresses[0]?.email_address,
                name: data?.first_name + ' ' + data.last_name,
                image: data?.image_url,
            }
        })
    }
)

// delete user from database 
const syncUserDeletion = inngest.createFunction(
    {id: "delete-user-with-clerk"},
    {event: "clerk/user.deleted"},
    async ({event}) => {
        const {data} = event;
        await prisma.user.delete({
            where: {
                id: data.id,
            }
        })
    }
)


// update user info when updated in clerk

const syncUserUpdation = inngest.createFunction(
    {id: "update-user-from-clerk"},
    {event: "clerk/user.updated"},
    async ({event}) => {
        const {data} = event;
        await prisma.user.update({
            where: {
                id: data.id,
            },
            data: {
                id: data.id,
                email: data.email_addresses[0]?.email_address,
                name: data?.first_name + ' ' + data.last_name,
                image: data?.image_url,
            }
        })
    }
)

// Create an empty array where we'll export future Inngest functions
export const functions = [syncUserCreation, syncUserDeletion, syncUserUpdation];
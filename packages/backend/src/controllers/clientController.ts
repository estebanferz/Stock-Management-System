import {Elysia} from "elysia";
import {getAllClients, getClientByFilter, updateClient, addClient, deleteClient} from "../services/clientService";
import {clientInsertDTO, clientUpdateDTO} from "@server/db/types";
import { t } from "elysia";


export const clientController = new Elysia({prefix: '/client'})
    .get("/", () => {
        return { message: "Client endpoint" };
    })
    .get(
        "/all",
        async ({ query }) => {
            if (query.name || query.id_number || query.email || query.phone_number) {
                return await getClientByFilter(
                    query.name,
                    query.id_number,
                    query.email,
                    query.phone_number,
                ); //Filter by parameters
            }

            return await getAllClients();
        },
        {
            detail: {
                summary: "Get all clients in DB",
                tags: ["clients"],
            },
        },
    )
    .post(
        "/",
        async ({body, set}) => {

            const newClient = {
                name: body.name,
                id_number: body.id_number,
                ...(body.email && { email: body.email }),
                ...(body.phone_number && { phone_number: body.phone_number }),
                ...(body.birth_date && { birth_date: body.birth_date })
            };
            
            const result = await addClient(newClient);
            set.status = 201;
            return result;
        },
        {
            body: t.Object({
                ...clientInsertDTO.properties,
            }),
            detail: {
                summary: "Insert a new client",
                tags: ["clients"],
            },
        }
    )
    .put(
        "/:client_id",
        async ({ body, params: { client_id }, set }) => {
            const {
                name,
                email,
                phone_number,
                id_number,
                birth_date,
            } = body;
            const updClient = {
                name,
                email,
                phone_number,
                id_number,
                birth_date,
            };
            const result = await updateClient(
                Number(client_id),
                updClient,
            );
            set.status = 200;
            return result;
        },
        {
            body: t.Object({
                ...clientUpdateDTO.properties,
            }),
            detail: {
                summary: "Update a client",
                tags: ["clients"],
            },
        },
    )
    .delete(
        "/:client_id",
        async ({ params: { client_id }, set }) => {
            const clientIdNum = Number(client_id);
            if (!Number.isInteger(clientIdNum) || clientIdNum <= 0) {
                set.status = 400;
                return false;
            }

            const result = await deleteClient(clientIdNum);
            if (!result) {
                set.status = 404;
                return false;
            }

            set.status = 200;
            return true;
        },
        {
            params: t.Object({
                client_id: t.Numeric({
                    minimum: 1,
                    errorMessage: 'ID de cliente debe ser un número positivo'
                })
            }),
            detail: {
                summary: "Delete a client",
                tags: ["clients"],
            },
        },
    )
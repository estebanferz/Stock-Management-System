import {Elysia} from "elysia";
import {getAllClients, getClientByFilter, getClientById, updateClient, addClient, deleteClient} from "../services/clientService";
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
    .get(
        "/:id",
        async (req) => {
            const { id } = req.params;
            return await getClientById(Number(id));
        },
        {
            detail: {
                summary: "Get client details by ID",
                tags: ["clients"],
            },
        }
    )
    .post(
        "/",
        async ({body, set}) => {

            const newClient = {
                name: body.name,
                id_number: Number(body.id_number),
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
                id_number: t.String(),
            }),
            detail: {
                summary: "Insert a new client",
                tags: ["clients"],
            },
        }
    )
    .put(
        "/:id",
        async ({ body, params: { id }, set }) => {

            const updClient = {
                name: body.name,
                email: body.email,
                phone_number: body.phone_number,
                id_number: Number(body.id_number),
                birth_date: body.birth_date,
            };
            const result = await updateClient(
                Number(id),
                updClient,
            );
            set.status = 200;
            return result;
        },
        {
            body: t.Object({
                ...clientUpdateDTO.properties,
                id_number: t.String(),
            }),
            detail: {
                summary: "Update a client",
                tags: ["clients"],
            },
        },
    )
    .delete(
        "/:id",
        async ({ params: { id }, set }) => {
            const clientIdNum = Number(id);
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
                id: t.Numeric({
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
import { Elysia, t } from "elysia";
import { getAllProviders, getProviderByFilter, getProviderById, addProvider, updateProvider, deleteProvider } from "../services/providerService";
import { providerInsertDTO, providerUpdateDTO } from "@server/db/types";

export const providerController = new Elysia({prefix: '/provider'})
    .get("/", () => {
        return { message: "Provider endpoint" };
    })
    .get(
        "/all",
        async ({ query }) => {
            if (query.name) {
                return await getProviderByFilter(
                    query.name,
                ); //Filter by parameter
            }

            return await getAllProviders();
        },
        {
            detail: {
                summary: "Get all providers in DB",
                tags: ["providers"],
            },
        },
    )
    .get(
        "/:id",
        async (req) => {
            const { id } = req.params;
            return await getProviderById(Number(id));
        },
        {
            detail: {
                summary: "Get provider details by ID",
                tags: ["providers"],
            },
        }
    )
    .post(
        "/",
        async ({body, set}) => {

            const newProvider = {
                name: body.name,
                phone_number: body.phone_number,
                ...(body.email && { email: body.email }),
                address: body.address,
            };
            
            const result = await addProvider(newProvider);
            set.status = 201;
            return result;
        },
        {
            body: t.Object({
                ...providerInsertDTO.properties,
            }),
            detail: {
                summary: "Insert a new provider",
                tags: ["providers"],
            },
        }
    )
    .put(
        "/:id",
        async ({ body, params: { id }, set }) => {

            const updProvider = {
                name: body.name,
                phone_number: body.phone_number,
                ...(body.email && { email: body.email }),
                address: body.address,  
            };

            const result = await updateProvider(
                Number(id),
                updProvider,
            );
            set.status = 200;
            return result;
        },
        {
            body: t.Object({
                ...providerUpdateDTO.properties,
            }),
            detail: {
                summary: "Update a provider",
                tags: ["providers"],
            },
        },
    )
    .delete(
        "/:id",
        async ({ params: { id }, set }) => {
            const providerIdNum = Number(id);
            if (!Number.isInteger(providerIdNum) || providerIdNum <= 0) {
                set.status = 400;
                return false;
            }

            const result = await deleteProvider(providerIdNum);
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
                    errorMessage: 'provider_id must be a positive integer',
                })
            }),
            detail: {
                summary: "Delete a provider",
                tags: ["providers"],
            },
        },
    )
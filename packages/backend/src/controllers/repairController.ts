import { Elysia, t } from "elysia";
import { getRepairsByFilter, getAllRepairs, addRepair, updateRepair, softDeleteRepair } from "../services/repairService"
import { repairInsertDTO, repairUpdateDTO } from "@server/db/types"

export const repairController = new Elysia({prefix: "/repair"})
    .get("/", () => {
        return { message: "Repair endpoint" };
    })
    .get(
        "/all",
        async ({ query }) => {
            if (query.datetime || 
                query.repair_state || 
                query.priority ||
                query.client_id ||
                query.technician_id ||
                query.device_id) {
                return await getRepairsByFilter(
                    query.datetime,
                    query.repair_state,
                    query.priority,
                    Number(query.client_id),
                    Number(query.technician_id),
                    Number(query.device_id)
                ); //Filter by parameters
            }

            return await getAllRepairs();
        },
        {
            detail: {
                summary: "Get all repairs in DB",
                tags: ["repairs"],
            },
        },
    )
    .post(
        "/",
        async ({body, set}) => {

            const newRepair = {
                datetime: body.datetime ? new Date(body.datetime) : undefined,
                repair_state: body.repair_state,
                priority: body.priority,
                description: body.description,
                ...(body.diagnostic && {diagnostic: body.diagnostic}),
                client_cost: body.client_cost,
                internal_cost: body.internal_cost,
                client_id: body.client_id,
                technician_id: body.technician_id,
                device_id: body.device_id
            };
            
            const result = await addRepair(newRepair);
            set.status = 201;
            return result;
        },
        {
            body: t.Object({
                ...repairInsertDTO.properties,
                datetime: t.String({ format: "date-time"})
            }),
            detail: {
                summary: "Insert a new repair",
                tags: ["repairs"],
            },
        }
    )
    .put(
        "/:id",
        async ({ body, params: { id }, set }) => {

            const updRepair = {
                repair_state: body.repair_state,
                priority: body.priority,
                description: body.description,
                ...(body.diagnostic && {diagnostic: body.diagnostic}),
                client_cost: body.client_cost,
                internal_cost: body.internal_cost,
                client_id: body.client_id,
                technician_id: body.technician_id,
                device_id: body.device_id
            };

            const result = await updateRepair(
                Number(id),
                updRepair,
            );
            set.status = 200;
            return result;
        },
        {
            body: t.Object({
                ...repairUpdateDTO.properties,
                datetime: t.String({ format: "date-time" })
            }),
            detail: {
                summary: "Update a repair",
                tags: ["repairs"],
            },
        },
    )
    .delete("/:id", async ({ params: { id }, set }) => {
        const ok = await softDeleteRepair(Number(id));
        set.status = ok ? 200 : 404;
        return ok;
    });
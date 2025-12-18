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
        if (
        query.date ||
        query.repair_state ||
        query.priority ||
        query.client_id ||
        query.technician_id ||
        query.device_id ||
        query.cost_min ||
        query.cost_max ||
        query.is_deleted
        ) {
        return await getRepairsByFilter({
            date: query.date,
            repair_state: query.repair_state,
            priority: query.priority,
            client_id: query.client_id,
            technician_id: query.technician_id,
            device_id: query.device_id,
            cost_min: query.cost_min,
            cost_max: query.cost_max,
            is_deleted: query.is_deleted === undefined ? undefined : query.is_deleted === "true",
        });
        }

        return await getAllRepairs();
    },
    {
        detail: {
        summary: "Get all repairs in DB",
        tags: ["repairs"],
        },
    }
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
import { Elysia, t } from "elysia";
import { getRepairsByFilter, getAllRepairs, addRepair, updateRepair, deleteRepair } from "../services/repairService"
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
        "/:repair_id",
        async ({ body, params: { repair_id }, set }) => {

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
                Number(repair_id),
                updRepair,
            );
            set.status = 200;
            return result;
        },
        {
            body: t.Object({
                ...repairUpdateDTO.properties,
            }),
            detail: {
                summary: "Update a repair",
                tags: ["repairs"],
            },
        },
    )
    .delete(
        "/:repair_id",
        async ({ params: { repair_id }, set }) => {
            const repairIdNum = Number(repair_id);
            if (!Number.isInteger(repairIdNum) || repairIdNum <= 0) {
                set.status = 400;
                return false;
            }

            const result = await deleteRepair(repairIdNum);
            if (!result) {
                set.status = 404;
                return false;
            }

            set.status = 200;
            return true;
        },
        {
            params: t.Object({
                repair_id: t.Numeric({
                    minimum: 1,
                    errorMessage: 'repair_id must be a positive integer',
                })
            }),
            detail: {
                summary: "Delete a repair",
                tags: ["repairs"],
            },
        },
    )

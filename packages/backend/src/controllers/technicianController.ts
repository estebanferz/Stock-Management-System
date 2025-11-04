import { Elysia, t } from "elysia";
import { getAllTechnicians, addTechnician, updateTechnician, deleteTechnician } from "../services/technicianService";
import { technicianInsertDTO, technicianUpdateDTO } from "@server/db/types"; 

export const technicianController = new Elysia({prefix: '/technician'})
    .get("/", () => {
        return { message: "Technician endpoint" };
    })
    .get(
        "/all",
        async () => {
            return await getAllTechnicians();
        },
        {
            detail: {
                summary: "Get all technicians in DB",
                tags: ["technicians"],
            },
        },
    )
    .post(
        "/",
        async ({body, set}) => {

            const newTechnician = {
                name: body.name,
                ...(body.email && { email: body.email }),
                ...(body.phone_number && { phone_number: body.phone_number }),
                speciality: body.speciality,
                state: body.state,
            };
            
            const result = await addTechnician(newTechnician);
            set.status = 201;
            return result;
        },
        {
            body: t.Object({
                ...technicianInsertDTO.properties,
            }),
            detail: {
                summary: "Insert a new technician",
                tags: ["technicians"],
            },
        }
    )
    .put(
        "/:technician_id",
        async ({ body, params: { technician_id }, set }) => {

            const updTechnician = {
                name: body.name,
                ...(body.email && { email: body.email }),
                ...(body.phone_number && { phone_number: body.phone_number }),
                speciality: body.speciality,
                state: body.state,
            };
            const result = await updateTechnician(
                Number(technician_id),
                updTechnician,
            );
            set.status = 200;
            return result;
        },
        {
            body: t.Object({
                ...technicianUpdateDTO.properties,
            }),
            detail: {
                summary: "Update a technician",
                tags: ["technicians"],
            },
        },
    )
    .delete(
        "/:technician_id",
        async ({ params: { technician_id }, set }) => {
            const technicianIdNum = Number(technician_id);
            if (!Number.isInteger(technicianIdNum) || technicianIdNum <= 0) {
                set.status = 400;
                return false;
            }

            const result = await deleteTechnician(technicianIdNum);
            if (!result) {
                set.status = 404;
                return false;
            }

            set.status = 200;
            return true;
        },
        {
            params: t.Object({
                technician_id: t.Numeric({
                    minimum: 1,
                    errorMessage: 'Technician ID must be a positive integer',
                })
            }),
            detail: {
                summary: "Delete a technician",
                tags: ["technicians"],
            },
        },
    )
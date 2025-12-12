import { Elysia, t } from "elysia";
import { getAllTechnicians, getTechnicianById, addTechnician, updateTechnician, softDeleteTechnician } from "../services/technicianService";
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
    .get(
        "/:id",
        async (req) => {
            const { id } = req.params;
            return await getTechnicianById(Number(id));
        },
        {
            detail: {
                summary: "Get technician details by ID",
                tags: ["technicians"],
            },
        }
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
        "/:id",
        async ({ body, params: { id }, set }) => {

            const updTechnician = {
                name: body.name,
                ...(body.email && { email: body.email }),
                ...(body.phone_number && { phone_number: body.phone_number }),
                speciality: body.speciality,
                state: body.state,
            };
            const result = await updateTechnician(
                Number(id),
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
    .delete("/:id", async ({ params: { id }, set }) => {
        const ok = await softDeleteTechnician(Number(id));
        set.status = ok ? 200 : 404;
        return ok;
    });
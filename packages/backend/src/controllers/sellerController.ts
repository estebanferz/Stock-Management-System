import { Elysia, t } from "elysia";
import { getSellersByFilter, getAllSellers, getSellerById, addSeller, updateSeller, softDeleteSeller} from "../services/sellerService";
import { sellerInsertDTO, sellerUpdateDTO } from "@server/db/types";

export const sellerController = new Elysia({prefix: "/seller"})
    .get("/", () => {
        return { message: "Seller endpoint" };
    })
    .get(
        "/all",
        async ({ query }) => {
            if (query.name || 
                query.hire_date || 
                query.pay_date) {
                return await getSellersByFilter(
                    query.name,
                    query.hire_date,
                    query.pay_date,
                ); //Filter by parameters
            }

            return await getAllSellers();
        },
        {
            detail: {
                summary: "Get all sellers in DB",
                tags: ["sellers"],
            },
        },
    )
    .post(
        "/",
        async ({body, set}) => {

            const newSeller = {
                name: body.name,
                age: body.age,
                ...(body.email && {email: body.email}),
                ...(body.phone_number && {phone_number: body.phone_number}),
                ...(body.hire_date && {hire_date: body.hire_date}),
                ...(body.pay_date && {pay_date: body.pay_date}),
                ...(body.commission && {commission: body.commission}),
            };
            
            const result = await addSeller(newSeller);
            set.status = 201;
            return result;
        },
        {
            body: t.Object({
                ...sellerInsertDTO.properties,
            }),
            detail: {
                summary: "Insert a new seller",
                tags: ["sellers"],
            },
        }
    )
    .get(
        "/:id",
        async (req) => {
            const { id } = req.params;
            return await getSellerById(Number(id));
        },
        {
            detail: {
                summary: "Get seller details by ID",
                tags: ["sellers"],
            },
        }
    )
    .put(
        "/:id",
        async ({ body, params: { id }, set }) => {

            const updPhone = {
                name: body.name,
                age: body.age,
                ...(body.email && {email: body.email}),
                ...(body.phone_number && {phone_number: body.phone_number}),
                ...(body.pay_date && {pay_date: body.pay_date}),
                hire_date: body.hire_date,
                ...(body.commission && {commission: body.commission}),
            };

            const result = await updateSeller(
                Number(id),
                updPhone,
            );
            set.status = 200;
            return result;
        },
        {
            body: t.Object({
                ...sellerUpdateDTO.properties,
            }),
            detail: {
                summary: "Update a seller",
                tags: ["sellers"],
            },
        },
    )
    .delete("/:id", async ({ params: { id }, set }) => {
        const ok = await softDeleteSeller(Number(id));
        set.status = ok ? 200 : 404;
        return ok;
    });
    
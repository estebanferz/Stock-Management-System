import { Elysia, t } from "elysia";
import { getSellersByFilter, getAllSellers, addSeller, updateSeller, deleteSeller} from "../services/sellerService";
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
                ...(body.pay_date && {pay_date: body.pay_date}),
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
    .put(
        "/:seller_id",
        async ({ body, params: { seller_id }, set }) => {

            const updPhone = {
                name: body.name,
                age: body.age,
                ...(body.email && {email: body.email}),
                ...(body.phone_number && {phone_number: body.phone_number}),
                ...(body.pay_date && {pay_date: body.pay_date}),
            };

            const result = await updateSeller(
                Number(seller_id),
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
    .delete(
        "/:seller_id",
        async ({ params: { seller_id }, set }) => {
            const sellerIdNum = Number(seller_id);
            if (!Number.isInteger(sellerIdNum) || sellerIdNum <= 0) {
                set.status = 400;
                return false;
            }

            const result = await deleteSeller(sellerIdNum);
            if (!result) {
                set.status = 404;
                return false;
            }

            set.status = 200;
            return true;
        },
        {
            params: t.Object({
                seller_id: t.Numeric({
                    minimum: 1,
                    errorMessage: 'seller_id must be a positive integer',
                })
            }),
            detail: {
                summary: "Delete a seller",
                tags: ["sellers"],
            },
        },
    )
    
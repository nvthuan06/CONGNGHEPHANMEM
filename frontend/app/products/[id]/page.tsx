// ./frontend/app/products/[id]/page.tsx
import ProductDetail from "@/components/ProductDetail";

export default async function Page({ params }:{ params : Promise<{ id : string}> }) {
    const { id } = await params;
    
    // Gọi component ProductDetail
    return <ProductDetail productID = {id} />
}
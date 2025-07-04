'use server';
import { z } from 'zod'; //biblioteca para tratar os tipos que serão inseridos no banco de dados
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation';
import postgres from 'postgres';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });


const FormSchema = z.object({
    id: z.string(),
    customerId: z.string({
        invalid_type_error: 'Please select a customer.',
    }),
    amount: z.coerce.number()
        .gt(0, { message: 'Please enter an amount greater than $0.'}),
    status: z.enum(['pending', 'paid'],{
        invalid_type_error: 'Please select an invoice status.',
    }),
    date: z.string(),
});

const CreateInvoice = FormSchema.omit({ id: true, date: true });
const UpdateInvoice = FormSchema.omit({ id: true, date: true });

export type State = {
  errors?: {
    customerId?: string[];
    amount?: string[];
    status?: string[];
  };
  message?: string | null;
};

export async function createInvoice(prevState: State, formData: FormData){
    const validatedFields = CreateInvoice.safeParse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    });

    if (!validatedFields.success) {
        return {
        errors: validatedFields.error.flatten().fieldErrors,
        message: 'Campos ausentes. Falha ao criar fatura.',
        };
    }

    const { customerId, amount, status } = validatedFields.data;
    const amountInCents = amount * 100;
    const date = new Date().toISOString().split('T')[0];
    try{
        await sql`
            INSERT INTO invoices (customer_id, amount, status, date)
            values (${customerId}, ${amountInCents}, ${status}, ${date})
        `
    }catch(e){
        return {
            message: 'Erro no Banco de Dados: Falha ao criar fatura.',
        };
    }

    revalidatePath('/dashboard/invoices'); //limpa o cache para exibir os novos dados na pagina
    redirect('/dashboard/invoices'); //utilizado para redirecionar para a dashboard apos criar a nova fatura
}

export async function updateInvoice(id:string, prevState: State, formData: FormData) {
    const validatedFields = UpdateInvoice.safeParse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    });

    if (!validatedFields.success) {
        return {
        errors: validatedFields.error.flatten().fieldErrors,
        message: 'Campos ausentes. Falha ao editar fatura.',
        };
    }

    const { customerId, amount, status } = validatedFields.data;
    
    const amountInCents = amount * 100;
    try{
        await sql`
            UPDATE invoices
            SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
            WHERE id = ${id}
        `;
    }catch(e){
        return {
            message: 'Erro no Banco de Dados: Falha ao editar fatura.',
        };
    }
    
    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
}

export async function deleteInvoice(id: string) {
  await sql`DELETE FROM invoices WHERE id = ${id}`;
  revalidatePath('/dashboard/invoices');
}
'use server';
/** Для обработки проверки типов у вас есть несколько вариантов. Хотя вы можете проверять типы вручную,
 * использование библиотеки проверки типов может сэкономить ваше время и усилия. Для вашего примера
 * мы будем использовать Zod, библиотеку проверки на основе TypeScript, которая может упростить вам эту задачу.
 **/
import { z } from 'zod';
import { mysql } from './mysql';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const FormSchema = z.object({
    id: z.string(),
    customerId: z.string(),
    amount: z.coerce.number(),
    status: z.enum(['pending', 'paid']),
    date: z.string(),
});

// Use Zod to update the expected types
const UpdateInvoice = FormSchema.omit({ id: true, date: true });

const CreateInvoice = FormSchema.omit({ id: true, date: true });
export async function createInvoice(formData: FormData) {
    const { customerId, amount, status } = CreateInvoice.parse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    });
    // Test it out:
    //console.log(customerId);
    //console.log(typeof amount);
    //Обычно рекомендуется хранить денежные значения в центах в вашей базе данных, чтобы исключить ошибки JavaScript с плавающей запятой и обеспечить большую точность.
    // Переведем сумму в центы:
    const amountInCents = amount * 100;
    // создадим новую дату в формате "ГГГГ-ММ-ДД"
    const date = new Date().toISOString().split('T')[0];

    try {
        let values = [customerId, amountInCents, status, date];
        await mysql.query(`INSERT INTO invoices (customer_id, amount, status, date) VALUES (?, ?, ?, ?)`, values);
        await mysql.end();
        revalidatePath('/dashboard/invoices');

    } catch (error) {
        return { error };
    }
    redirect('/dashboard/invoices');
}

export async function updateInvoice(id: string, formData: FormData) {
    const { customerId, amount, status } = UpdateInvoice.parse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    });
    const amountInCents = amount * 100;

    // Test it out:
    //console.log(customerId, amount, amountInCents, status);

    try {
        const sqlquery = `UPDATE invoices SET customer_id = '${customerId}', amount = '${amountInCents}', status = '${status}' WHERE id = '${id}'`;
        //console.log(sqlquery);
        //let values = [customerId, amountInCents, status, id];
        let values = [];
        await mysql.query(sqlquery, values);
        await mysql.end();

    } catch (error) {
        return { error };
    }
    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
}

export async function deleteInvoice(id: string) {
    try {
        const sqlquery = `DELETE FROM invoices WHERE id = '?'`;
        //console.log(sqlquery);
        let values = [id];
        //let values = [];
        await mysql.query(sqlquery, values);
        await mysql.end();
        revalidatePath('/dashboard/invoices');
        return { message: 'Deleted Invoice' };

    } catch (error) {
        return { error };
    }
}
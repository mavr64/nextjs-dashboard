import {
  CustomerField,
  CustomersTableType,
  InvoiceForm,
  InvoicesTable,
  LatestInvoiceRaw,
  Revenue,
} from './definitions';
import { formatCurrency } from './utils';
import excuteQuery from "./mysql";
import {invoices} from "@/app/lib/placeholder-data";
import {map} from "zod";
import LatestInvoices from "@/app/ui/dashboard/latest-invoices";

export async function fetchRevenue() {
  try {
     console.log('Fetching revenue data...');
     await new Promise((resolve) => setTimeout(resolve, 2000));

    const sqlquery = `SELECT * FROM revenue`;
    const data = await excuteQuery<Revenue>({query: sqlquery, values: null});
    console.log('Revenue data fetch completed:');  //  , data
    return data;

  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch revenue data.');
  }
}

export async function fetchLatestInvoices() {
  try {
    let sqlquery;
    sqlquery = `
      SELECT invoices.amount, customers.name, customers.image_url, customers.email, invoices.id
      FROM invoices
      JOIN customers ON invoices.customer_id = customers.id
      ORDER BY invoices.date DESC
      LIMIT 5`;
    const latestInvoices = await excuteQuery<LatestInvoiceRaw>({query: sqlquery, values: null});
    console.log('Data invoices fetch completed:');  //  , latestInvoices

    /*const latestInvoices = {data.map((invoice) => ({
      ...invoice,
      amount: formatCurrency(invoice.amount),
    }))<LatestInvoices>};*/
    return latestInvoices;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch the latest invoices.');
  }
}

export async function fetchCardData() {
  try {
    // You can probably combine these into a single SQL query
    // However, we are intentionally splitting them to demonstrate
    // how to initialize multiple queries in parallel with JS.
    const invoiceCountPromise = excuteQuery({query: `SELECT COUNT(*) AS cnt FROM invoices`, values: null});
    const customerCountPromise = excuteQuery({query: `SELECT COUNT(*) AS cnt FROM customers`, values: null});
    const invoiceStatusPromise = excuteQuery({query: `SELECT
                                                        SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) AS "paid",
                                                        SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) AS "pending"
                                                      FROM invoices`, values: null});

    const data = await Promise.all([
      invoiceCountPromise,
      customerCountPromise,
      invoiceStatusPromise,
    ]);

    const cd = data.map((invoice) => ({
      ...invoice,
    }))
    //console.log('============================');
    console.log('Card invoiceCountPromise=', cd);
    //console.log('============================');


    const numberOfInvoices = Number(data[0][0].cnt ?? '0');
    const numberOfCustomers = Number(data[1][0].cnt ?? '0');
    const totalPaidInvoices = formatCurrency(Number(data[2][0].paid ?? '0'));
    const totalPendingInvoices = formatCurrency(Number(data[2][0].pending ?? '0'));
//console.log('Card: ', {numberOfInvoices, numberOfCustomers, totalPaidInvoices, totalPendingInvoices});
    return {
      numberOfCustomers,
      numberOfInvoices,
      totalPaidInvoices,
      totalPendingInvoices,
    };
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch card data.');
  }
}

const ITEMS_PER_PAGE = 6;
export async function fetchFilteredInvoices(
  query: string,
  currentPage: number,
) {
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  try {
    if (query == '') {query = 'com'}
    let sqlquery = `SELECT invoices.id, invoices.amount, invoices.date, invoices.status, customers.name, customers.email, customers.image_url FROM invoices JOIN customers ON invoices.customer_id = customers.id WHERE customers.name LIKE '%${query}%' OR customers.email LIKE '%${query}%' OR invoices.amount LIKE '%${query}%' OR invoices.date LIKE '%${query}%' OR invoices.status LIKE '%${query}%' ORDER BY invoices.date DESC LIMIT ${ITEMS_PER_PAGE} OFFSET ${offset}`;
    const invoices = await excuteQuery<InvoicesTable>(
        {query: sqlquery, values: []}
    );
//    console.log('SQL: ', sqlquery);
    console.log('Invoices data fetch completed:', invoices);

    return invoices;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch invoices.');
  }
}

export async function fetchInvoicesPages(query: string) {
  try {
    const count = await excuteQuery({query:`SELECT COUNT(*) AS cnt FROM invoices JOIN customers ON invoices.customer_id = customers.id WHERE customers.name LIKE '%${query}%' OR customers.email LIKE '%${query}%' OR invoices.amount LIKE '%${query}%' OR invoices.date LIKE '%${query}%' OR invoices.status LIKE '%${query}%'`, values: null});
    console.log('count:'+count?.[0].cnt, count);

    const totalPages = Math.ceil(Number(count?.[0].cnt) / ITEMS_PER_PAGE);
    return totalPages;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch total number of invoices.');
  }
}

export async function fetchInvoiceById(id: string) {
  try {
    const sqlquery = `SELECT invoices.id, invoices.customer_id, invoices.amount, invoices.status FROM invoices WHERE invoices.id = '${id}'`;
    console.log(sqlquery);
    const data = await excuteQuery<InvoiceForm>({query: sqlquery, values: [id]});

    //console.log('============================');
    //console.log('data fetchInvoiceById:', data);
    //console.log('============================');
    /*const invoice = data.map((invoice) => ({
      ...invoice,
      // Convert amount from cents to dollars
      amount: invoice.amount / 100,
    }));*/
    const invoice = [];
    for (const invoice1 of data) {
      invoice.push({
        ...invoice1,
        // Convert amount from cents to dollars
        amount: invoice1.amount / 100,
      });
    }
    console.log('invoice fetchInvoiceById:', invoice[0]);

    return invoice[0];
  } catch (error) {
    console.error('Database Error fetchInvoiceById:', error);
    throw new Error('Failed to fetch invoice by id.');
  }
}

export async function fetchCustomers() {
  try {
    const data = await excuteQuery<CustomerField>({query:`SELECT id, name FROM customers ORDER BY name ASC`, values: []});

    console.log('data fetchCustomers fetch completed:', data);
    //const customers = data;
    const customers = [];
    for (const customers1 of data) {
      customers.push({
        ...customers1,

      });
    }
    return customers;
  } catch (err) {
    console.error('Database Error:', err);
    throw new Error('Failed to fetch all customers.');
  }
}

export async function fetchFilteredCustomers(query: string) {
  try {
    const data = await excuteQuery<CustomersTableType>`
		SELECT
		  customers.id,
		  customers.name,
		  customers.email,
		  customers.image_url,
		  COUNT(invoices.id) AS total_invoices,
		  SUM(CASE WHEN invoices.status = 'pending' THEN invoices.amount ELSE 0 END) AS total_pending,
		  SUM(CASE WHEN invoices.status = 'paid' THEN invoices.amount ELSE 0 END) AS total_paid
		FROM customers
		LEFT JOIN invoices ON customers.id = invoices.customer_id
		WHERE
		  customers.name ILIKE ${`%${query}%`} OR
        customers.email ILIKE ${`%${query}%`}
		GROUP BY customers.id, customers.name, customers.email, customers.image_url
		ORDER BY customers.name ASC
	  `;

    const customers = data.rows.map((customer) => ({
      ...customer,
      total_pending: formatCurrency(customer.total_pending),
      total_paid: formatCurrency(customer.total_paid),
    }));

    return customers;
  } catch (err) {
    console.error('Database Error:', err);
    throw new Error('Failed to fetch customer table.');
  }
}

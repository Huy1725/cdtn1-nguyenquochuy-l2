import { createApplication } from "./app.js";

// Du lieu demo giong seeds/001_demo.sql, chi dung khi chay bang repository bo nho.
function seedDemo({ customerRepository }) {
  const customer = customerRepository.save({
    full_name: "Nguyen AB", phone: "0901234567", email: "ab@example.com", segment: "STANDARD"
  });
  customerRepository.saveDevice({
    customer_id: customer.customer_id, serial_no: "A001", purchase_date: "2026-01-15", warranty_months: 12
  });
}

const port = Number(process.env.PORT ?? 3000);
const app = createApplication();
seedDemo(app);
app.server.listen(port, () => {
  console.log(`Warranty API listening on http://localhost:${port}`);
});

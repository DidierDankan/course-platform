import * as Yup from "yup";

// Same limits as server/validators/courseValidator.js, which is what actually enforces them.
const MIN_PAID_PRICE = 0.5;
const MAX_PRICE = 999999.99;

export const CourseSchema = Yup.object().shape({
  title: Yup.string().trim().max(255, "255 characters at most").required("Title is required"),
  description: Yup.string().trim().required("Description is required"),
  price: Yup.number()
    .typeError("Enter a price (0 for a free course)")
    .required("Enter a price (0 for a free course)")
    .min(0, "Price can't be negative")
    .max(MAX_PRICE, `Price can be at most ${MAX_PRICE}`)
    .test(
      "min-paid-price",
      `A paid course must cost at least ${MIN_PAID_PRICE.toFixed(2)}`,
      (value) => value === undefined || value === 0 || value >= MIN_PAID_PRICE
    ),
});

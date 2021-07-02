import sgMail from "@sendgrid/mail";
import dotenv from "dotenv";
dotenv.config("../../.env");

function sendEmail(to, products) {
	sgMail.setApiKey(process.env.SENDGRID_API_KEY);
	let content = "";
	products.forEach((p) => (content += `<li> Nome: ${p.name} --- Quantidade: ${p.quantity} --- Preço unitário: ${p.price} </li>`));
	const msg = {
		to: to,
		from: "mateuskuritza@gmail.com",
		subject: "Techstore confirmação de compra",
		text: "Compra feita com sucesso!",
		html: `<strong>Keep buying :)</strong> <ul> ${content} </ul>`,
	};
	(async () => {
		try {
			await sgMail.send(msg);
		} catch (error) {
			console.error(error);

			if (error.response) {
				console.error(error.response.body);
			}
		}
	})();
}

export default sendEmail;

import {
	Body,
	Container,
	Head,
	Heading,
	Html,
	Preview,
	Section,
	Text,
} from "@react-email/components";
import * as React from "react";

type WelcomeEmailProps = {
	name?: string;
};

const containerStyle = {
	border: "1px solid #e5e7eb",
	borderRadius: "12px",
	padding: "24px",
	backgroundColor: "#ffffff",
};

const headingStyle = {
	fontSize: "24px",
	fontWeight: "700",
	margin: "0 0 12px 0",
};

const textStyle = {
	fontSize: "16px",
	lineHeight: "1.6",
	margin: "0 0 12px 0",
	color: "#111827",
};

export const WelcomeEmail = ({ name }: WelcomeEmailProps) => {
	const displayName = name ?? "there";

	return (
		<Html>
			<Head />
			<Preview>Welcome to Buddy</Preview>
			<Body
				style={{
					backgroundColor: "#f9fafb",
					fontFamily: "Inter, Arial, sans-serif",
				}}
			>
				<Container style={containerStyle}>
					<Heading as="h1" style={headingStyle}>
						Welcome, {displayName}!
					</Heading>
					<Section>
						<Text style={textStyle}>
							We&apos;re excited to have you trying the Buddy backend starter.
							This email was sent through Resend with React Email.
						</Text>
						<Text style={textStyle}>
							If you have questions, just reply to this message and we&apos;ll
							help you out.
						</Text>
						<Text style={textStyle}>– The Buddy Team</Text>
					</Section>
				</Container>
			</Body>
		</Html>
	);
};

export default WelcomeEmail;

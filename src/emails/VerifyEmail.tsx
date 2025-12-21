import {
	Body,
	Button,
	Container,
	Head,
	Heading,
	Html,
	Preview,
	Section,
	Text,
} from "@react-email/components";
import * as React from "react";

type VerifyEmailProps = {
	name?: string;
	url: string;
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

export const VerifyEmail = ({ name, url }: VerifyEmailProps) => {
	const displayName = name ?? "there";

	return (
		<Html>
			<Head />
			<Preview>Verify your email for Buddy</Preview>
			<Body
				style={{
					backgroundColor: "#f9fafb",
					fontFamily: "Inter, Arial, sans-serif",
				}}
			>
				<Container style={containerStyle}>
					<Heading as="h1" style={headingStyle}>
						Verify your email, {displayName}
					</Heading>
					<Section>
						<Text style={textStyle}>
							Please confirm your email address to activate your account.
						</Text>
						<Button
							href={url}
							style={{
								backgroundColor: "#111827",
								color: "#ffffff",
								padding: "12px 20px",
								borderRadius: "8px",
								textDecoration: "none",
								fontWeight: 600,
							}}
						>
							Verify Email
						</Button>
						<Text style={textStyle}>
							If the button doesn&apos;t work, copy and paste this link into
							your browser:
							<br />
							<a href={url}>{url}</a>
						</Text>
						<Text style={textStyle}>
							If you didn&apos;t request this, you can safely ignore it.
						</Text>
						<Text style={textStyle}>– The Buddy Team</Text>
					</Section>
				</Container>
			</Body>
		</Html>
	);
};

export default VerifyEmail;

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

type ResetPasswordEmailProps = {
	name?: string;
	url?: string;
	token: string;
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

export const ResetPasswordEmail = ({
	name,
	url,
	token,
}: ResetPasswordEmailProps) => {
	const displayName = name ?? "there";

	return (
		<Html>
			<Head />
			<Preview>Reset your Buddy password</Preview>
			<Body
				style={{
					backgroundColor: "#f9fafb",
					fontFamily: "Inter, Arial, sans-serif",
				}}
			>
				<Container style={containerStyle}>
					<Heading as="h1" style={headingStyle}>
						Reset your password, {displayName}
					</Heading>
					<Section>
						<Text style={textStyle}>
							We received a request to reset your password. If you didn&apos;t
							make this request, you can ignore this email.
						</Text>
						{url ? (
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
								Reset password
							</Button>
						) : null}
						<Text style={textStyle}>
							Reset token: <code>{token}</code>
						</Text>
						{url ? (
							<Text style={textStyle}>
								If the button doesn&apos;t work, copy and paste this link into
								your browser:
								<br />
								<a href={url}>{url}</a>
							</Text>
						) : null}
						<Text style={textStyle}>– The Buddy Team</Text>
					</Section>
				</Container>
			</Body>
		</Html>
	);
};

export default ResetPasswordEmail;

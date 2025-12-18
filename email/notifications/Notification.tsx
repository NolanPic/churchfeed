import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Link,
  Font,
} from "@react-email/components";
import React from "react";

interface NotificationProps {
  title: string;
  children: React.ReactNode;
}

export const Notification: React.FC<NotificationProps> = ({
  title,
  children,
}) => {
  return (
    <Html>
      <Head>
        <Font
          fontFamily="Gentium Plus"
          fallbackFontFamily="Georgia"
          webFont={{
            url: "https://fonts.googleapis.com/css2?family=Gentium+Plus:ital@1&display=swap",
            format: "woff2",
          }}
          fontWeight={400}
          fontStyle="italic"
        />
        <Font
          fontFamily="Lato"
          fallbackFontFamily="Arial"
          webFont={{
            url: "https://fonts.googleapis.com/css2?family=Lato:wght@400;700&display=swap",
            format: "woff2",
          }}
          fontWeight={400}
          fontStyle="normal"
        />
      </Head>
      <Body
        style={{
          margin: 0,
          padding: 0,
          backgroundColor: "#424769",
          backgroundImage: "linear-gradient(to bottom, #424769, #5B628B)",
          fontFamily: "Lato, Arial, sans-serif",
        }}
      >
        <Container
          style={{
            maxWidth: "600px",
            margin: "0 auto",
            padding: "40px 20px",
          }}
        >
          {/* Title */}
          <Section
            style={{ textAlign: "center" as const, marginBottom: "32px" }}
          >
            <Text
              style={{
                fontFamily: "'Gentium Plus', Georgia, serif",
                fontStyle: "italic",
                fontSize: "28px",
                color: "#E0E0E0",
                margin: "0 0 12px 0",
              }}
            >
              {title}
            </Text>

            {/* Chevron Icon */}
            <div style={{ margin: "0 auto", width: "30px" }}>
              <svg
                width="30"
                height="20"
                viewBox="0 0 30 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M3 3L15 13L27 3"
                  stroke="#F6B17A"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M3 10L15 20L27 10"
                  stroke="#F6B17A"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </Section>

          {/* Content Card */}
          <Section
            style={{
              backgroundColor: "#424769",
              borderRadius: "32px",
              padding: "57px 47px",
              boxShadow:
                "21px 16px 63px -36px rgba(0, 0, 0, 0.25), -21px 16px 63px -36px rgba(0, 0, 0, 0.25)",
              marginBottom: "32px",
            }}
          >
            {children}
          </Section>

          {/* Footer */}
          <Section style={{ textAlign: "center" }}>
            <Text
              style={{
                fontSize: "14px",
                color: "#E0E0E0",
                margin: 0,
              }}
            >
              <Link
                href="/profile"
                style={{
                  color: "#F6B17A",
                  textDecoration: "none",
                }}
              >
                Manage notification settings
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

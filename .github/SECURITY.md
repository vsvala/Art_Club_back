# Security Policy

Thank you for helping improve the security of the Art Club Backend project.

## Supported Versions

This project does not currently maintain multiple parallel release lines. Security fixes are applied to the `master` branch and the latest production version.

| Version                | Supported |
| ---------------------- | --------- |
| master                 | Yes       |
| older releases / forks | No        |

## Reporting a Vulnerability

If you discover a security issue, **do not open a public GitHub issue**.

Please report the vulnerability privately to the project maintainer through GitHub or another prearranged private channel. If you report it through GitHub, ask the maintainer to confirm receipt before sharing details more broadly.

A strong report includes as much of the following as possible:

- a short description of the issue
- the impact and likely severity
- clear steps to reproduce
- a proof of concept, if available
- whether the issue affects production, test environments, or local development
- any relevant logs, responses, or screenshots

The maintainer's goals are to:

- acknowledge receipt in a reasonable time
- assess the impact
- prepare a fix
- publish the fix before any public disclosure

## Security Considerations for This Backend

This backend uses the following security-related mechanisms:

- JWT-based authentication
- role-based access control (`admin` / user)
- bcrypt password hashing
- MongoDB connections configured through environment variables
- Cloudinary integration for image storage
- Multer file uploads with size limits

Based on the project structure, pay particular attention to:

- **secrets and keys**: `SECRET`, MongoDB connection strings, and Cloudinary keys must stay in environment variables only
- **authorization**: all user-specific and admin-level routes must be protected by middleware
- **file uploads**: MIME type checks alone are not enough to guarantee that a file is safe
- **error responses**: production responses should not expose stack traces or internal error objects to clients
- **personal data**: user data responses should minimize the visible fields

## Safe Disclosure Expectations

We ask for responsible disclosure practices:

- give the maintainer reasonable time to analyze and fix the issue
- avoid publishing exploits or detailed attack instructions before a fix is available
- if the issue affects a third-party service or library, follow that vendor's disclosure policy as well

## Development Security Notes

If you are developing the project locally:

- do not commit `.env` files, tokens, or API keys
- use separate credentials for test and production environments
- rotate secrets immediately if you suspect exposure
- review dependencies regularly and keep them up to date
- avoid using production data in local development

## Scope

This policy applies to this backend repository: `vsvala/Art_Club_back`.

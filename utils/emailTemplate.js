const buildEmailTemplate = ({
  title,
  userName,
  content,
  buttonText,
  buttonLink
}) => {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
  </head>
  <body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;">
    
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:20px 0;">
      <tr>
        <td align="center">

          <!-- MAIN CONTAINER -->
          <table width="600" cellpadding="0" cellspacing="0" 
            style="background:#ffffff;border-radius:8px;overflow:hidden;max-width:600px;width:100%;">

            <!-- HEADER -->
            <tr>
              <td style="background:#111827;padding:20px;text-align:center;">
                <img src="https://yourdomain.com/logo.png" 
                     alt="Dhanya Collections" 
                     width="140"
                     style="display:block;margin:0 auto;" />
              </td>
            </tr>

            <!-- BODY -->
            <tr>
              <td style="padding:30px;">
                <h2 style="margin:0 0 15px;color:#111827;">${title}</h2>
                <p style="margin:0 0 15px;color:#374151;font-size:15px;">
                  Hi ${userName},
                </p>

                ${content}

                ${
                  buttonText && buttonLink
                    ? `
                    <div style="text-align:center;margin:25px 0;">
                      <a href="${buttonLink}"
                        style="background:#111827;color:#ffffff;
                               padding:12px 20px;
                               text-decoration:none;
                               border-radius:5px;
                               font-size:14px;
                               display:inline-block;">
                        ${buttonText}
                      </a>
                    </div>
                    `
                    : ""
                }

              </td>
            </tr>

            <!-- FOOTER -->
            <tr>
              <td style="background:#f9fafb;padding:20px;text-align:center;font-size:12px;color:#6b7280;">
                <p style="margin:0 0 5px;">Need help? Contact our support team.</p>
                <p style="margin:0 0 5px;">📧 support@dhanyacollections.com</p>
                <p style="margin:0;">© ${new Date().getFullYear()} Dhanya Collections. All rights reserved.</p>
              </td>
            </tr>

          </table>

        </td>
      </tr>
    </table>

  </body>
  </html>
  `;
};

module.exports = buildEmailTemplate;

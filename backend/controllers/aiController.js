const AuditLog = require('../models/AuditLog');

// ─── POST /api/ai-summary ──────────────────────────────────────────────────
// Calls Grok/xAI API (or falls back to mock) to summarize employee data.
// OWASP: AI_API_KEY stored in .env, never exposed in responses.

exports.getAISummary = async (req, res, next) => {
  try {
    const { employee } = req.body;

    if (!employee || typeof employee !== 'object') {
      return res.status(400).json({ message: 'Employee data is required.' });
    }

    // ─── Sanitize employee data before sending to AI ───────────────────
    // PII protection: mask salary in AI prompt
    const safeEmployee = {
      name: employee.name,
      department: employee.department,
      position: employee.position,
      // Mask exact salary for privacy
      salaryRange: employee.salary < 50000 ? 'Entry' : employee.salary < 100000 ? 'Mid' : 'Senior',
    };

    const prompt = `You are an HR assistant. Provide a 2-3 sentence professional summary of this employee profile:
Name: ${safeEmployee.name}
Department: ${safeEmployee.department}
Position: ${safeEmployee.position}
Salary Band: ${safeEmployee.salaryRange}-level

Keep the summary professional and concise.`;

    let summary;

    if (process.env.AI_API_KEY && process.env.AI_API_KEY !== 'your_grok_api_key_here') {
      // ─── Real Grok/xAI API call ────────────────────────────────────
      const response = await fetch(process.env.AI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.AI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'grok-beta',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 200,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`AI API error: ${response.status}`);
      }

      const data = await response.json();
      summary = data.choices?.[0]?.message?.content || 'Unable to generate summary.';
    } else {
      // ─── Mock AI fallback ──────────────────────────────────────────
      summary = `${safeEmployee.name} is a ${safeEmployee.salaryRange.toLowerCase()}-level professional in the ${safeEmployee.department} department, currently serving as ${safeEmployee.position}. They contribute meaningfully to team objectives and demonstrate strong domain expertise. Their profile reflects a solid career trajectory within the organization.`;
    }

    await AuditLog.create({
      action: 'AI_SUMMARY',
      userId: req.user._id,
      userEmail: req.user.email,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      status: 'success',
      details: `AI summary generated for: ${employee.name}`,
    });

    res.status(200).json({ summary });
  } catch (err) {
    next(err);
  }
};

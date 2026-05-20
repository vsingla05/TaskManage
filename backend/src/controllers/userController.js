import User from '../models/User.js';

/** Search users by name or email (admin only) — used when inviting members to a project. */
export async function searchUsers(req, res) {
  try {
    const raw = String(req.query.q || '').trim();
    if (raw.length < 2) {
      return res.json({ users: [] });
    }
    const safe = raw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const rx = new RegExp(safe, 'i');
    const users = await User.find({
      $or: [{ email: rx }, { name: rx }],
    })
      .select('name email role')
      .limit(25)
      .lean();
    res.json({
      users: users.map((u) => ({
        id: u._id,
        name: u.name,
        email: u.email,
        role: u.role,
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to search users' });
  }
}

const teamMemberModel = require('../models/teamMemberModel');

// true ถ้า user เป็น leader ของทีมนี้
exports.isTeamLeader = async (teamId, userId) => {
    const member = await teamMemberModel.checkMember(teamId, userId);
    return Boolean(member && member.team_role === 'leader');
};
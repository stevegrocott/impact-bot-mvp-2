/**
 * Organization Controller
 * Handles organization management and member operations
 */

import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '@/config/database';
import { AppError, ValidationError } from '@/utils/errors';
import { logger } from '@/utils/logger';
import { validateEmail } from '@/utils/validation';
import { emailService } from '@/services/emailService';

export class OrganizationController {
  /**
   * Create new organization
   */
  async createOrganization(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new AppError('Not authenticated', 401, 'NOT_AUTHENTICATED');
    }

    const { name, description, industry, website, settings } = req.body;
    const userId = req.user.id;

    // Validation
    if (!name || name.trim().length === 0) {
      throw new ValidationError('Organization name is required');
    }

    if (name.trim().length > 255) {
      throw new ValidationError('Organization name must be 255 characters or less');
    }

    if (description && description.length > 1000) {
      throw new ValidationError('Description must be 1000 characters or less');
    }

    try {
      const result = await prisma.$transaction(async (tx) => {
        // Check if organization name already exists
        const existingOrg = await tx.organization.findFirst({
          where: { 
            name: name.trim(),
            isActive: true 
          }
        });

        if (existingOrg) {
          throw new ValidationError('An organization with this name already exists');
        }

        // Create organization
        const organization = await tx.organization.create({
          data: {
            id: uuidv4(),
            name: name.trim(),
            description: description?.trim() || null,
            industry: industry?.trim() || null,
            website: website?.trim() || null,
            isActive: true,
            settings: settings || {}
          }
        });

        // Get or create org_admin role
        const orgAdminRole = await tx.role.findUnique({
          where: { name: 'org_admin' }
        });

        if (!orgAdminRole) {
          throw new AppError('Organization admin role not found', 500, 'ROLE_NOT_FOUND');
        }

        // Add creator as organization admin
        await tx.userOrganization.create({
          data: {
            id: uuidv4(),
            userId,
            organizationId: organization.id,
            roleId: orgAdminRole.id,
            isPrimary: false // They can choose to make it primary later
          }
        });

        return { organization, role: orgAdminRole };
      });

      logger.info('Organization created successfully', {
        userId,
        organizationId: result.organization.id,
        organizationName: result.organization.name
      });

      res.status(201).json({
        success: true,
        message: 'Organization created successfully',
        data: {
          organization: {
            id: result.organization.id,
            name: result.organization.name,
            description: result.organization.description,
            industry: result.organization.industry,
            website: result.organization.website,
            isActive: result.organization.isActive,
            settings: result.organization.settings,
            memberCount: 1,
            role: {
              id: result.role.id,
              name: result.role.name,
              permissions: result.role.permissions
            }
          }
        }
      });

    } catch (error) {
      logger.error('Failed to create organization', {
        error,
        userId,
        organizationName: name
      });
      throw error;
    }
  }

  /**
   * Get organization details
   */
  async getOrganization(req: Request, res: Response): Promise<void> {
    const { organizationId } = req.params;

    if (!organizationId) {
      throw new ValidationError('Organization ID is required');
    }

    try {
      const organization = await prisma.organization.findUnique({
        where: { 
          id: organizationId,
          isActive: true 
        },
        include: {
          userOrganizations: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true,
                  jobTitle: true,
                  isActive: true
                }
              },
              role: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                  permissions: true
                }
              }
            },
            where: {
              user: {
                isActive: true
              }
            }
          }
        }
      });

      if (!organization) {
        throw new AppError('Organization not found', 404, 'ORGANIZATION_NOT_FOUND');
      }

      // Check if user has access to this organization
      if (req.user && req.user.id) {
        const hasAccess = organization.userOrganizations.some(
          uo => uo.userId === req.user!.id
        );

        if (!hasAccess) {
          throw new AppError('Access denied to this organization', 403, 'ACCESS_DENIED');
        }
      }

      // Calculate member statistics
      const memberCount = organization.userOrganizations.length;
      const roleDistribution = organization.userOrganizations.reduce((acc, uo) => {
        acc[uo.role.name] = (acc[uo.role.name] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      logger.info('Organization retrieved successfully', {
        organizationId,
        memberCount,
        requestedBy: req.user?.id
      });

      res.json({
        success: true,
        data: {
          organization: {
            id: organization.id,
            name: organization.name,
            description: organization.description,
            industry: organization.industry,
            website: organization.website,
            isActive: organization.isActive,
            settings: organization.settings,
            memberCount,
            roleDistribution,
            members: organization.userOrganizations.map(uo => ({
              userId: uo.user.id,
              email: uo.user.email,
              firstName: uo.user.firstName,
              lastName: uo.user.lastName,
              jobTitle: uo.user.jobTitle,
              isPrimary: uo.isPrimary,
              role: {
                id: uo.role.id,
                name: uo.role.name,
                description: uo.role.description
              },
              joinedAt: uo.joinedAt
            })),
            createdAt: organization.createdAt,
            updatedAt: organization.updatedAt
          }
        }
      });

    } catch (error) {
      logger.error('Failed to get organization', {
        error,
        organizationId,
        requestedBy: req.user?.id
      });
      throw error;
    }
  }

  /**
   * Update organization
   */
  async updateOrganization(req: Request, res: Response): Promise<void> {
    const { organizationId } = req.params;
    const { name, description, industry, website } = req.body;

    if (!organizationId) {
      throw new ValidationError('Organization ID is required');
    }

    // Validation
    if (name !== undefined) {
      if (!name || name.trim().length === 0) {
        throw new ValidationError('Organization name cannot be empty');
      }
      if (name.trim().length > 255) {
        throw new ValidationError('Organization name must be 255 characters or less');
      }
    }

    if (description !== undefined && description && description.length > 1000) {
      throw new ValidationError('Description must be 1000 characters or less');
    }

    try {
      // Check if organization exists and user has access
      const existingOrg = await prisma.organization.findUnique({
        where: { 
          id: organizationId,
          isActive: true 
        },
        include: {
          userOrganizations: {
            where: {
              userId: req.user!.id
            },
            include: {
              role: true
            }
          }
        }
      });

      if (!existingOrg) {
        throw new AppError('Organization not found', 404, 'ORGANIZATION_NOT_FOUND');
      }

      if (existingOrg.userOrganizations.length === 0) {
        throw new AppError('Access denied to this organization', 403, 'ACCESS_DENIED');
      }

      // Check if name already exists (if name is being updated)
      if (name && name.trim() !== existingOrg.name) {
        const nameExists = await prisma.organization.findFirst({
          where: {
            name: name.trim(),
            isActive: true,
            id: { not: organizationId }
          }
        });

        if (nameExists) {
          throw new ValidationError('An organization with this name already exists');
        }
      }

      // Prepare update data
      const updateData: any = {};
      if (name !== undefined) updateData.name = name.trim();
      if (description !== undefined) updateData.description = description?.trim() || null;
      if (industry !== undefined) updateData.industry = industry?.trim() || null;
      if (website !== undefined) updateData.website = website?.trim() || null;

      // Update organization
      const updatedOrganization = await prisma.organization.update({
        where: { id: organizationId },
        data: updateData,
        include: {
          userOrganizations: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true,
                  jobTitle: true
                }
              },
              role: {
                select: {
                  id: true,
                  name: true,
                  description: true
                }
              }
            },
            where: {
              user: {
                isActive: true
              }
            }
          }
        }
      });

      logger.info('Organization updated successfully', {
        organizationId,
        updatedBy: req.user!.id,
        updatedFields: Object.keys(updateData)
      });

      res.json({
        success: true,
        message: 'Organization updated successfully',
        data: {
          organization: {
            id: updatedOrganization.id,
            name: updatedOrganization.name,
            description: updatedOrganization.description,
            industry: updatedOrganization.industry,
            website: updatedOrganization.website,
            isActive: updatedOrganization.isActive,
            settings: updatedOrganization.settings,
            memberCount: updatedOrganization.userOrganizations.length,
            updatedAt: updatedOrganization.updatedAt
          }
        }
      });

    } catch (error) {
      logger.error('Failed to update organization', {
        error,
        organizationId,
        updatedBy: req.user?.id
      });
      throw error;
    }
  }

  /**
   * Get organization members
   */
  async getMembers(req: Request, res: Response): Promise<void> {
    const { organizationId } = req.params;
    const { page = 1, limit = 20, role, search } = req.query;

    if (!organizationId) {
      throw new ValidationError('Organization ID is required');
    }

    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);
    const offset = (pageNumber - 1) * limitNumber;

    try {
      // Check if organization exists and user has access
      const hasAccess = await prisma.userOrganization.findFirst({
        where: {
          organizationId,
          userId: req.user!.id,
          organization: {
            isActive: true
          }
        }
      });

      if (!hasAccess) {
        throw new AppError('Organization not found or access denied', 404, 'ACCESS_DENIED');
      }

      // Build where conditions for filtering
      const whereConditions: any = {
        organizationId,
        user: {
          isActive: true
        }
      };

      if (role) {
        whereConditions.role = {
          name: role as string
        };
      }

      if (search) {
        whereConditions.user.OR = [
          { firstName: { contains: search as string, mode: 'insensitive' } },
          { lastName: { contains: search as string, mode: 'insensitive' } },
          { email: { contains: search as string, mode: 'insensitive' } },
          { jobTitle: { contains: search as string, mode: 'insensitive' } }
        ];
      }

      // Get members with pagination
      const [members, totalCount] = await Promise.all([
        prisma.userOrganization.findMany({
          where: whereConditions,
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                jobTitle: true,
                isActive: true,
                lastLoginAt: true,
                createdAt: true
              }
            },
            role: {
              select: {
                id: true,
                name: true,
                description: true,
                permissions: true
              }
            }
          },
          orderBy: [
            { isPrimary: 'desc' },
            { joinedAt: 'asc' }
          ],
          skip: offset,
          take: limitNumber
        }),
        prisma.userOrganization.count({
          where: whereConditions
        })
      ]);

      // Get role distribution for the organization
      const roleDistribution = await prisma.userOrganization.groupBy({
        by: ['roleId'],
        where: {
          organizationId,
          user: {
            isActive: true
          }
        },
        _count: {
          roleId: true
        }
      });

      // Get role names for the distribution
      const roleIds = roleDistribution.map(rd => rd.roleId);
      const roles = await prisma.role.findMany({
        where: {
          id: { in: roleIds }
        },
        select: {
          id: true,
          name: true
        }
      });

      const totalPages = Math.ceil(totalCount / limitNumber);

      logger.info('Organization members retrieved successfully', {
        organizationId,
        totalMembers: totalCount,
        page: pageNumber,
        requestedBy: req.user!.id
      });

      res.json({
        success: true,
        data: {
          members: members.map(member => ({
            userId: member.user.id,
            email: member.user.email,
            firstName: member.user.firstName,
            lastName: member.user.lastName,
            jobTitle: member.user.jobTitle,
            isPrimary: member.isPrimary,
            isActive: member.user.isActive,
            role: {
              id: member.role.id,
              name: member.role.name,
              description: member.role.description,
              permissions: member.role.permissions
            },
            joinedAt: member.joinedAt,
            lastLoginAt: member.user.lastLoginAt
          })),
          pagination: {
            page: pageNumber,
            limit: limitNumber,
            total: totalCount,
            totalPages,
            hasNext: pageNumber < totalPages,
            hasPrev: pageNumber > 1
          },
          roleDistribution: roleDistribution.map(rd => {
            const role = roles.find(r => r.id === rd.roleId);
            return {
              roleId: rd.roleId,
              roleName: role?.name || 'Unknown',
              count: rd._count.roleId
            };
          })
        }
      });

    } catch (error) {
      logger.error('Failed to get organization members', {
        error,
        organizationId,
        requestedBy: req.user?.id
      });
      throw error;
    }
  }

  /**
   * Invite user to organization
   */
  async inviteMember(req: Request, res: Response): Promise<void> {
    const { organizationId } = req.params;
    const { email, roleId, message } = req.body;

    if (!organizationId) {
      throw new ValidationError('Organization ID is required');
    }

    if (!email || !validateEmail(email)) {
      throw new ValidationError('Valid email address is required');
    }

    if (!roleId) {
      throw new ValidationError('Role ID is required');
    }

    try {
      // Check if organization exists and user has permission to invite
      const organization = await prisma.organization.findUnique({
        where: { 
          id: organizationId,
          isActive: true 
        },
        include: {
          userOrganizations: {
            where: {
              userId: req.user!.id
            },
            include: {
              role: true
            }
          }
        }
      });

      if (!organization) {
        throw new AppError('Organization not found', 404, 'ORGANIZATION_NOT_FOUND');
      }

      if (organization.userOrganizations.length === 0) {
        throw new AppError('Access denied to this organization', 403, 'ACCESS_DENIED');
      }

      // Verify the role exists - handle both ID and name lookup
      let targetRole;
      try {
        // First try as UUID
        targetRole = await prisma.role.findUnique({
          where: { id: roleId }
        });
      } catch (error) {
        // If not a valid UUID, try by name
        targetRole = await prisma.role.findUnique({
          where: { name: roleId }
        });
      }

      if (!targetRole) {
        throw new ValidationError('Invalid role specified');
      }

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase() }
      });

      if (existingUser) {
        // Check if user is already a member of this organization
        const existingMembership = await prisma.userOrganization.findUnique({
          where: {
            userId_organizationId: {
              userId: existingUser.id,
              organizationId
            }
          }
        });

        if (existingMembership) {
          throw new ValidationError('User is already a member of this organization');
        }

        // Add existing user directly to organization
        const userOrganization = await prisma.userOrganization.create({
          data: {
            id: uuidv4(),
            userId: existingUser.id,
            organizationId,
            roleId,
            isPrimary: false
          },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                jobTitle: true
              }
            },
            role: {
              select: {
                id: true,
                name: true,
                description: true
              }
            }
          }
        });

        logger.info('Existing user added to organization', {
          organizationId,
          userId: existingUser.id,
          email,
          role: targetRole.name,
          invitedBy: req.user!.id
        });

        res.status(201).json({
          success: true,
          message: 'User added to organization successfully',
          data: {
            member: {
              userId: userOrganization.user.id,
              email: userOrganization.user.email,
              firstName: userOrganization.user.firstName,
              lastName: userOrganization.user.lastName,
              jobTitle: userOrganization.user.jobTitle,
              role: {
                id: userOrganization.role.id,
                name: userOrganization.role.name,
                description: userOrganization.role.description
              },
              joinedAt: userOrganization.joinedAt,
              isPrimary: userOrganization.isPrimary
            }
          }
        });
      } else {
        // Create invitation for new user and send email
        const invitationId = uuidv4();
        const invitationToken = uuidv4(); // Secure token for invitation acceptance
        
        // Store invitation in organization settings
        const currentSettings = organization.settings as any || {};
        const invitations = currentSettings.pendingInvitations || [];
        
        const invitation = {
          id: invitationId,
          token: invitationToken,
          email: email.toLowerCase(),
          roleId,
          roleName: targetRole.name,
          message: message || null,
          invitedBy: req.user!.id,
          invitedByName: `${req.user!.firstName || ''} ${req.user!.lastName || ''}`.trim(),
          invitedAt: new Date().toISOString(),
          status: 'pending',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
        };
        
        invitations.push(invitation);
        
        // Update organization with invitation record
        await prisma.organization.update({
          where: { id: organizationId },
          data: {
            settings: {
              ...currentSettings,
              pendingInvitations: invitations
            }
          }
        });

        // Send invitation email
        const emailData = {
          inviteeEmail: email.toLowerCase(),
          inviterName: invitation.invitedByName || req.user!.email,
          organizationName: organization.name,
          invitationToken: invitationToken,
          roleName: targetRole.name,
          message: message,
          expiresAt: invitation.expiresAt
        };

        const emailSent = await emailService.sendInvitationEmail(emailData);
        
        if (!emailSent) {
          logger.warn('Failed to send invitation email', {
            organizationId,
            email,
            invitationId
          });
        }

        logger.info('User invitation created and email sent', {
          organizationId,
          email,
          role: targetRole.name,
          invitationId,
          emailSent,
          invitedBy: req.user!.id
        });

        res.status(201).json({
          success: true,
          message: emailSent 
            ? 'Invitation sent successfully' 
            : 'Invitation created (email delivery pending)',
          data: {
            invitation: {
              id: invitationId,
              email,
              role: {
                id: targetRole.id,
                name: targetRole.name,
                description: targetRole.description
              },
              message,
              status: 'pending',
              expiresAt: invitation.expiresAt,
              invitedBy: invitation.invitedByName,
              emailSent
            }
          }
        });
      }

    } catch (error) {
      logger.error('Failed to invite member to organization', {
        error,
        organizationId,
        email,
        invitedBy: req.user?.id
      });
      throw error;
    }
  }

  /**
   * Update member role
   */
  async updateMemberRole(req: Request, res: Response): Promise<void> {
    const { organizationId, userId } = req.params;
    const { roleId } = req.body;

    if (!organizationId || !userId) {
      throw new ValidationError('Organization ID and User ID are required');
    }

    if (!roleId) {
      throw new ValidationError('Role ID is required');
    }

    try {
      // Check if the requester has access to manage members in this organization
      const requesterAccess = await prisma.userOrganization.findFirst({
        where: {
          organizationId,
          userId: req.user!.id,
          organization: {
            isActive: true
          }
        },
        include: {
          role: true
        }
      });

      if (!requesterAccess) {
        throw new AppError('Organization not found or access denied', 404, 'ACCESS_DENIED');
      }

      // Verify the target role exists
      const targetRole = await prisma.role.findUnique({
        where: { id: roleId }
      });

      if (!targetRole) {
        throw new ValidationError('Invalid role specified');
      }

      // Check if the member exists in this organization
      const memberAccess = await prisma.userOrganization.findUnique({
        where: {
          userId_organizationId: {
            userId,
            organizationId
          }
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              jobTitle: true
            }
          },
          role: true
        }
      });

      if (!memberAccess) {
        throw new AppError('Member not found in this organization', 404, 'MEMBER_NOT_FOUND');
      }

      // Prevent users from changing their own role to avoid privilege escalation
      if (userId === req.user!.id) {
        throw new ValidationError('You cannot change your own role');
      }

      // Update the member role
      const updatedMembership = await prisma.userOrganization.update({
        where: {
          userId_organizationId: {
            userId,
            organizationId
          }
        },
        data: {
          roleId
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              jobTitle: true
            }
          },
          role: {
            select: {
              id: true,
              name: true,
              description: true,
              permissions: true
            }
          }
        }
      });

      logger.info('Member role updated successfully', {
        organizationId,
        userId,
        oldRole: memberAccess.role.name,
        newRole: targetRole.name,
        updatedBy: req.user!.id
      });

      res.json({
        success: true,
        message: 'Member role updated successfully',
        data: {
          member: {
            userId: updatedMembership.user.id,
            email: updatedMembership.user.email,
            firstName: updatedMembership.user.firstName,
            lastName: updatedMembership.user.lastName,
            jobTitle: updatedMembership.user.jobTitle,
            isPrimary: updatedMembership.isPrimary,
            role: {
              id: updatedMembership.role.id,
              name: updatedMembership.role.name,
              description: updatedMembership.role.description,
              permissions: updatedMembership.role.permissions
            },
            joinedAt: updatedMembership.joinedAt
          }
        }
      });

    } catch (error) {
      logger.error('Failed to update member role', {
        error,
        organizationId,
        userId,
        roleId,
        updatedBy: req.user?.id
      });
      throw error;
    }
  }

  /**
   * Remove member from organization
   */
  async removeMember(req: Request, res: Response): Promise<void> {
    const { organizationId, userId } = req.params;

    if (!organizationId || !userId) {
      throw new ValidationError('Organization ID and User ID are required');
    }

    try {
      // Check if the requester has access to manage members in this organization
      const requesterAccess = await prisma.userOrganization.findFirst({
        where: {
          organizationId,
          userId: req.user!.id,
          organization: {
            isActive: true
          }
        },
        include: {
          role: true
        }
      });

      if (!requesterAccess) {
        throw new AppError('Organization not found or access denied', 404, 'ACCESS_DENIED');
      }

      // Check if the member exists in this organization
      const memberAccess = await prisma.userOrganization.findUnique({
        where: {
          userId_organizationId: {
            userId,
            organizationId
          }
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true
            }
          },
          role: true
        }
      });

      if (!memberAccess) {
        throw new AppError('Member not found in this organization', 404, 'MEMBER_NOT_FOUND');
      }

      // Prevent users from removing themselves
      if (userId === req.user!.id) {
        throw new ValidationError('You cannot remove yourself from the organization');
      }

      // Check if this is the last admin in the organization
      if (memberAccess.role.name === 'org_admin' || memberAccess.role.name === 'super_admin') {
        const adminCount = await prisma.userOrganization.count({
          where: {
            organizationId,
            role: {
              name: {
                in: ['org_admin', 'super_admin']
              }
            }
          }
        });

        if (adminCount <= 1) {
          throw new ValidationError('Cannot remove the last administrator from the organization');
        }
      }

      // Remove the member
      await prisma.userOrganization.delete({
        where: {
          userId_organizationId: {
            userId,
            organizationId
          }
        }
      });

      logger.info('Member removed from organization successfully', {
        organizationId,
        userId,
        memberEmail: memberAccess.user.email,
        memberRole: memberAccess.role.name,
        removedBy: req.user!.id
      });

      res.json({
        success: true,
        message: 'Member removed from organization successfully',
        data: {
          removedMember: {
            userId: memberAccess.user.id,
            email: memberAccess.user.email,
            firstName: memberAccess.user.firstName,
            lastName: memberAccess.user.lastName,
            role: memberAccess.role.name
          }
        }
      });

    } catch (error) {
      logger.error('Failed to remove member from organization', {
        error,
        organizationId,
        userId,
        removedBy: req.user?.id
      });
      throw error;
    }
  }

  /**
   * Get organization settings
   */
  async getSettings(req: Request, res: Response): Promise<void> {
    const { organizationId } = req.params;

    if (!organizationId) {
      throw new ValidationError('Organization ID is required');
    }

    try {
      // Check if user has access to this organization
      const userAccess = await prisma.userOrganization.findFirst({
        where: {
          organizationId,
          userId: req.user!.id,
          organization: {
            isActive: true
          }
        },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              settings: true
            }
          },
          role: true
        }
      });

      if (!userAccess) {
        throw new AppError('Organization not found or access denied', 404, 'ACCESS_DENIED');
      }

      // Default settings structure
      const defaultSettings = {
        privacy: 'private',
        allowPublicReports: false,
        defaultReportAccess: 'members',
        dataRetentionPeriod: '7years',
        allowMemberInvitations: true,
        requireEmailVerification: true,
        autoApproveMembers: false,
        notificationPreferences: {
          newMembers: true,
          reportUpdates: true,
          systemAnnouncements: true
        },
        integrations: {
          enabled: [],
          webhooks: []
        },
        pendingInvitations: []
      };

      // Merge with actual settings
      const settings = {
        ...defaultSettings,
        ...(userAccess.organization.settings as any || {})
      };

      logger.info('Organization settings retrieved', {
        organizationId,
        requestedBy: req.user!.id
      });

      res.json({
        success: true,
        data: {
          settings,
          organization: {
            id: userAccess.organization.id,
            name: userAccess.organization.name
          },
          userRole: {
            id: userAccess.role.id,
            name: userAccess.role.name,
            permissions: userAccess.role.permissions
          }
        }
      });

    } catch (error) {
      logger.error('Failed to get organization settings', {
        error,
        organizationId,
        requestedBy: req.user?.id
      });
      throw error;
    }
  }

  /**
   * Update organization settings
   */
  async updateSettings(req: Request, res: Response): Promise<void> {
    const { organizationId } = req.params;
    const settingsUpdate = req.body;

    if (!organizationId) {
      throw new ValidationError('Organization ID is required');
    }

    if (!settingsUpdate || typeof settingsUpdate !== 'object') {
      throw new ValidationError('Settings object is required');
    }

    try {
      // Check if user has access to update settings for this organization
      const userAccess = await prisma.userOrganization.findFirst({
        where: {
          organizationId,
          userId: req.user!.id,
          organization: {
            isActive: true
          }
        },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              settings: true
            }
          },
          role: true
        }
      });

      if (!userAccess) {
        throw new AppError('Organization not found or access denied', 404, 'ACCESS_DENIED');
      }

      // Validate settings based on user role
      const allowedSettings = this.getAllowedSettingsForRole(userAccess.role.name);
      const invalidSettings = Object.keys(settingsUpdate).filter(
        key => !allowedSettings.includes(key)
      );

      if (invalidSettings.length > 0) {
        throw new ValidationError(
          `You do not have permission to update these settings: ${invalidSettings.join(', ')}`
        );
      }

      // Get current settings
      const currentSettings = (userAccess.organization.settings as any) || {};

      // Merge settings (deep merge for nested objects)
      const updatedSettings = this.mergeSettings(currentSettings, settingsUpdate);

      // Update organization settings
      const updatedOrganization = await prisma.organization.update({
        where: { id: organizationId },
        data: {
          settings: updatedSettings
        },
        select: {
          id: true,
          name: true,
          settings: true,
          updatedAt: true
        }
      });

      logger.info('Organization settings updated successfully', {
        organizationId,
        updatedBy: req.user!.id,
        updatedFields: Object.keys(settingsUpdate)
      });

      res.json({
        success: true,
        message: 'Organization settings updated successfully',
        data: {
          settings: updatedOrganization.settings,
          organization: {
            id: updatedOrganization.id,
            name: updatedOrganization.name
          },
          updatedAt: updatedOrganization.updatedAt
        }
      });

    } catch (error) {
      logger.error('Failed to update organization settings', {
        error,
        organizationId,
        updatedBy: req.user?.id
      });
      throw error;
    }
  }

  /**
   * Get allowed settings for a role
   */
  private getAllowedSettingsForRole(roleName: string): string[] {
    const baseSettings = [
      'notificationPreferences',
      'defaultReportAccess'
    ];

    const adminSettings = [
      'privacy',
      'allowPublicReports',
      'dataRetentionPeriod',
      'allowMemberInvitations',
      'requireEmailVerification',
      'autoApproveMembers',
      'integrations',
      ...baseSettings
    ];

    switch (roleName) {
      case 'super_admin':
      case 'org_admin':
        return adminSettings;
      case 'impact_manager':
        return [...baseSettings, 'defaultReportAccess', 'allowPublicReports'];
      default:
        return baseSettings;
    }
  }

  /**
   * Deep merge settings objects
   */
  private mergeSettings(current: any, updates: any): any {
    const result = { ...current };

    for (const key in updates) {
      if (updates[key] && typeof updates[key] === 'object' && !Array.isArray(updates[key])) {
        result[key] = this.mergeSettings(current[key] || {}, updates[key]);
      } else {
        result[key] = updates[key];
      }
    }

    return result;
  }
}

// Create controller instance
export const organizationController = new OrganizationController();
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkMasterAccount() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'info.aftw@gmail.com' },
      include: {
        _count: {
          select: {
            expenses: true,
            notifications: true,
            childUsers: true
          }
        }
      }
    })
    
    console.log('Master Account Details:')
    console.log(JSON.stringify(user, null, 2))
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkMasterAccount()

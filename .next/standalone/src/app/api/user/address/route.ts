import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

// GET: Fetch all saved addresses for a user
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  let email = searchParams.get('email');
  if (email === 'undefined' || email === 'null' || !email?.trim()) {
    email = null;
  }

  // Fallback to NextAuth session
  if (!email) {
    const session = await getServerSession(authOptions);
    email = session?.user?.email || null;
  }

  if (!email) {
    return NextResponse.json({ error: 'E-posta adresi gereklidir' }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        addresses: {
          orderBy: { isDefault: 'desc' }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ addresses: [] });
    }

    return NextResponse.json({ addresses: user.addresses });
  } catch (error) {
    console.error('Error fetching addresses:', error);
    return NextResponse.json({ error: 'Adresler çekilirken hata oluştu' }, { status: 500 });
  }
}

// POST: Add a new address
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { addressTitle, firstName, lastName, phone, city, district, fullAddress } = body;
    let { email, isDefault = false } = body;
    if (email === 'undefined' || email === 'null' || !email?.trim()) {
      email = null;
    }

    // Fallback to NextAuth session
    if (!email) {
      const session = await getServerSession(authOptions);
      email = session?.user?.email || null;
    }

    if (!email) {
      return NextResponse.json({ error: 'E-posta adresi gereklidir' }, { status: 400 });
    }

    if (!addressTitle || !firstName || !lastName || !phone || !city || !district || !fullAddress) {
      return NextResponse.json({ error: 'Lütfen tüm zorunlu alanları doldurun.' }, { status: 400 });
    }

    // Find user or create if they exist in session but not in DB
    let user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name: `${firstName} ${lastName}`,
          role: 'USER',
          isApproved: true
        }
      });
    }

    // If marked as default, set other addresses of this user to false
    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId: user.id },
        data: { isDefault: false }
      });
    } else {
      // If this is the user's first address, make it default automatically
      const count = await prisma.address.count({
        where: { userId: user.id }
      });
      if (count === 0) {
        isDefault = true;
      }
    }

    const newAddress = await prisma.address.create({
      data: {
        userId: user.id,
        addressTitle,
        firstName,
        lastName,
        phone,
        city,
        district,
        fullAddress,
        isDefault
      }
    });

    return NextResponse.json({ success: true, address: newAddress });
  } catch (error: any) {
    console.error('Error creating address:', error);
    return NextResponse.json({ error: error.message || 'Adres eklenirken hata oluştu' }, { status: 500 });
  }
}

// PATCH: Set an address as default or update it
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, isDefault, addressTitle, firstName, lastName, phone, city, district, fullAddress } = body;

    if (!id) {
      return NextResponse.json({ error: 'Adres ID gereklidir.' }, { status: 400 });
    }

    const address = await prisma.address.findUnique({
      where: { id }
    });

    if (!address) {
      return NextResponse.json({ error: 'Adres bulunamadı.' }, { status: 404 });
    }

    // If setting as default, update others
    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId: address.userId },
        data: { isDefault: false }
      });
    }

    const updatedAddress = await prisma.address.update({
      where: { id },
      data: {
        ...(addressTitle && { addressTitle }),
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(phone && { phone }),
        ...(city && { city }),
        ...(district && { district }),
        ...(fullAddress && { fullAddress }),
        ...(isDefault !== undefined && { isDefault })
      }
    });

    return NextResponse.json({ success: true, address: updatedAddress });
  } catch (error: any) {
    console.error('Error updating address:', error);
    return NextResponse.json({ error: error.message || 'Adres güncellenirken hata oluştu' }, { status: 500 });
  }
}

// DELETE: Remove an address
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Adres ID gereklidir.' }, { status: 400 });
  }

  try {
    const address = await prisma.address.findUnique({ where: { id } });
    if (!address) {
      return NextResponse.json({ error: 'Adres bulunamadı.' }, { status: 404 });
    }

    await prisma.address.delete({
      where: { id }
    });

    // If we deleted the default address, make another one default
    if (address.isDefault) {
      const nextAddress = await prisma.address.findFirst({
        where: { userId: address.userId }
      });
      if (nextAddress) {
        await prisma.address.update({
          where: { id: nextAddress.id },
          data: { isDefault: true }
        });
      }
    }

    return NextResponse.json({ success: true, message: 'Adres başarıyla silindi.' });
  } catch (error: any) {
    console.error('Error deleting address:', error);
    return NextResponse.json({ error: error.message || 'Adres silinirken hata oluştu' }, { status: 500 });
  }
}

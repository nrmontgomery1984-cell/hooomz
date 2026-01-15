/**
 * Example usage of the customers module
 *
 * This file demonstrates how to use the CustomerService
 * with the InMemoryCustomerRepository.
 */

import {
  CustomerService,
  InMemoryCustomerRepository,
} from '../index';

import {
  CustomerType,
  ContactMethod,
  isSuccessResponse,
  type CreateCustomer,
} from '@hooomz/shared-contracts';

/**
 * Example: Basic CRUD operations
 */
async function exampleCRUD() {
  const repository = new InMemoryCustomerRepository();
  const service = new CustomerService({ customerRepository: repository });

  console.log('=== CRUD Example ===\n');

  // Create a customer
  console.log('1. Creating customer...');
  const createData: CreateCustomer = {
    firstName: 'John',
    lastName: 'Smith',
    email: 'john.smith@example.com',
    phone: '506-555-0123',
    type: CustomerType.RESIDENTIAL,
    preferredContactMethod: ContactMethod.EMAIL,
    address: {
      street: '123 Main Street',
      city: 'Fredericton',
      province: 'NB',
      postalCode: 'E3B 1A1',
      country: 'Canada',
    },
  };

  const createResponse = await service.create(createData);
  if (!isSuccessResponse(createResponse)) {
    console.error('Failed to create:', createResponse.error);
    return;
  }

  const customer = createResponse.data;
  console.log('✅ Created:', customer.id, '-', customer.firstName, customer.lastName);

  // Read the customer
  console.log('\n2. Reading customer...');
  const getResponse = await service.getById(customer.id);
  if (isSuccessResponse(getResponse)) {
    console.log('✅ Found:', getResponse.data.firstName, getResponse.data.lastName);
  }

  // Update the customer
  console.log('\n3. Updating customer contact preference...');
  const updateResponse = await service.update(customer.id, {
    id: customer.id,
    preferredContactMethod: ContactMethod.PHONE,
  });
  if (isSuccessResponse(updateResponse)) {
    console.log('✅ Updated preference:', updateResponse.data.preferredContactMethod);
  }

  // List customers
  console.log('\n4. Listing customers...');
  const listResponse = await service.list({
    page: 1,
    pageSize: 10,
  });
  if (isSuccessResponse(listResponse)) {
    console.log('✅ Found', listResponse.data.length, 'customer(s)');
  }

  // Delete the customer
  console.log('\n5. Deleting customer...');
  const deleteResponse = await service.delete(customer.id);
  if (isSuccessResponse(deleteResponse)) {
    console.log('✅ Deleted successfully');
  }
}

/**
 * Example: Customer search
 */
async function exampleSearch() {
  const repository = new InMemoryCustomerRepository();
  const service = new CustomerService({ customerRepository: repository });

  console.log('\n=== Search Example ===\n');

  // Create multiple customers
  const customers = [
    { firstName: 'John', lastName: 'Smith', email: 'john.smith@example.com', phone: '506-555-0123' },
    { firstName: 'Jane', lastName: 'Doe', email: 'jane.doe@example.com', phone: '506-555-0456' },
    { firstName: 'Bob', lastName: 'Johnson', email: 'bob.johnson@example.com', phone: '506-555-0789' },
    { firstName: 'Alice', lastName: 'Smith', email: 'alice.smith@example.com', phone: '506-555-0147' },
  ];

  for (const c of customers) {
    await service.create({
      ...c,
      type: CustomerType.RESIDENTIAL,
      preferredContactMethod: ContactMethod.EMAIL,
      address: {
        street: '123 Test St',
        city: 'Fredericton',
        province: 'NB',
        postalCode: 'E3B 1A1',
        country: 'Canada',
      },
    });
  }

  // Search by last name
  console.log('1. Search for "Smith"');
  const smithSearch = await service.searchCustomers('Smith');
  if (isSuccessResponse(smithSearch)) {
    console.log('   Found:', smithSearch.data.length, 'customers');
    smithSearch.data.forEach((c) => console.log('   -', c.firstName, c.lastName));
  }

  // Search by email
  console.log('\n2. Search for "jane"');
  const janeSearch = await service.searchCustomers('jane');
  if (isSuccessResponse(janeSearch)) {
    console.log('   Found:', janeSearch.data.length, 'customer(s)');
    janeSearch.data.forEach((c) => console.log('   -', c.email));
  }

  // Search by phone
  console.log('\n3. Search for "0789"');
  const phoneSearch = await service.searchCustomers('0789');
  if (isSuccessResponse(phoneSearch)) {
    console.log('   Found:', phoneSearch.data.length, 'customer(s)');
    phoneSearch.data.forEach((c) => console.log('   -', c.phone));
  }
}

/**
 * Example: Duplicate detection
 */
async function exampleDuplicates() {
  const repository = new InMemoryCustomerRepository();
  const service = new CustomerService({ customerRepository: repository });

  console.log('\n=== Duplicate Detection Example ===\n');

  // Create first customer
  const firstCustomer = await service.create({
    firstName: 'Sarah',
    lastName: 'Connor',
    email: 'sarah.connor@example.com',
    phone: '506-555-1234',
    type: CustomerType.RESIDENTIAL,
    preferredContactMethod: ContactMethod.EMAIL,
    address: {
      street: '100 Skynet Ave',
      city: 'Moncton',
      province: 'NB',
      postalCode: 'E1C 2B3',
      country: 'Canada',
    },
  });

  if (isSuccessResponse(firstCustomer)) {
    console.log('✅ First customer created:', firstCustomer.data.email);
  }

  // Try to create duplicate with same email
  console.log('\n1. Attempting to create duplicate (same email)...');
  const duplicateEmail = await service.create({
    firstName: 'Sarah',
    lastName: 'Connor',
    email: 'sarah.connor@example.com', // Same email!
    phone: '506-555-9999',
    type: CustomerType.RESIDENTIAL,
    preferredContactMethod: ContactMethod.EMAIL,
  });

  if (!duplicateEmail.success) {
    console.log('❌ Rejected:', duplicateEmail.error?.message);
    console.log('   Duplicates found:', duplicateEmail.error?.details);
  }

  // Try to create duplicate with same phone
  console.log('\n2. Attempting to create duplicate (same phone)...');
  const duplicatePhone = await service.create({
    firstName: 'John',
    lastName: 'Connor',
    email: 'john.connor@example.com',
    phone: '506-555-1234', // Same phone!
    type: CustomerType.RESIDENTIAL,
    preferredContactMethod: ContactMethod.EMAIL,
  });

  if (!duplicatePhone.success) {
    console.log('❌ Rejected:', duplicatePhone.error?.message);
  }
}

/**
 * Example: Contact preferences and formatting
 */
async function exampleContactPreferences() {
  const repository = new InMemoryCustomerRepository();
  const service = new CustomerService({ customerRepository: repository });

  console.log('\n=== Contact Preferences Example ===\n');

  // Create customers with different preferences
  const emailPref = await service.create({
    firstName: 'Emily',
    lastName: 'Brown',
    email: 'emily.brown@example.com',
    phone: '506-555-1111',
    type: CustomerType.COMMERCIAL,
    preferredContactMethod: ContactMethod.EMAIL,
    company: 'Brown Construction Ltd',
    address: {
      street: '456 Business Park',
      unit: 'Suite 200',
      city: 'Saint John',
      province: 'NB',
      postalCode: 'E2K 3L4',
      country: 'Canada',
    },
  });

  const phonePref = await service.create({
    firstName: 'Michael',
    lastName: 'Davis',
    email: 'michael.davis@example.com',
    phone: '506-555-2222',
    type: CustomerType.RESIDENTIAL,
    preferredContactMethod: ContactMethod.PHONE,
    address: {
      street: '789 Pine Road',
      city: 'Bathurst',
      province: 'NB',
      postalCode: 'E2A 1B2',
      country: 'Canada',
    },
  });

  if (isSuccessResponse(emailPref) && isSuccessResponse(phonePref)) {
    console.log('1. Email preference customer:');
    const contact1 = service.getPreferredContact(emailPref.data);
    console.log('   Method:', contact1.method);
    console.log('   Label:', contact1.label);

    console.log('\n2. Phone preference customer:');
    const contact2 = service.getPreferredContact(phonePref.data);
    console.log('   Method:', contact2.method);
    console.log('   Label:', contact2.label);

    console.log('\n3. Address formatting:');
    console.log('   Inline:', service.formatCustomerAddress(emailPref.data, 'inline'));
    console.log('   Multiline:');
    const multiline = service.formatCustomerAddress(emailPref.data, 'multiline');
    multiline.split('\n').forEach((line) => console.log('   ', line));
  }
}

/**
 * Example: Filtering
 */
async function exampleFiltering() {
  const repository = new InMemoryCustomerRepository();
  const service = new CustomerService({ customerRepository: repository });

  console.log('\n=== Filtering Example ===\n');

  // Create mix of residential and commercial customers
  await service.create({
    firstName: 'Alex',
    lastName: 'Residential',
    email: 'alex.r@example.com',
    phone: '506-555-0001',
    type: CustomerType.RESIDENTIAL,
    preferredContactMethod: ContactMethod.EMAIL,
  });

  await service.create({
    firstName: 'Business',
    lastName: 'Commercial',
    email: 'business.c@example.com',
    phone: '506-555-0002',
    type: CustomerType.COMMERCIAL,
    preferredContactMethod: ContactMethod.EMAIL,
    company: 'ABC Corp',
  });

  await service.create({
    firstName: 'Another',
    lastName: 'Residential',
    email: 'another.r@example.com',
    phone: '506-555-0003',
    type: CustomerType.RESIDENTIAL,
    preferredContactMethod: ContactMethod.EMAIL,
  });

  // Filter by type
  console.log('1. Filter by type (RESIDENTIAL)');
  const residential = await service.list({
    filters: { type: CustomerType.RESIDENTIAL },
  });
  if (isSuccessResponse(residential)) {
    console.log('   Found:', residential.data.length, 'customers');
    residential.data.forEach((c) => console.log('   -', c.firstName, c.lastName));
  }

  // Filter by type
  console.log('\n2. Filter by type (COMMERCIAL)');
  const commercial = await service.list({
    filters: { type: CustomerType.COMMERCIAL },
  });
  if (isSuccessResponse(commercial)) {
    console.log('   Found:', commercial.data.length, 'customers');
    commercial.data.forEach((c) => console.log('   -', c.company || c.firstName));
  }

  // Filter with search
  console.log('\n3. Filter with search (Residential)');
  const searchFiltered = await service.list({
    filters: { search: 'Residential' },
  });
  if (isSuccessResponse(searchFiltered)) {
    console.log('   Found:', searchFiltered.data.length, 'customers');
  }
}

/**
 * Run all examples
 */
async function runExamples() {
  try {
    await exampleCRUD();
    await exampleSearch();
    await exampleDuplicates();
    await exampleContactPreferences();
    await exampleFiltering();

    console.log('\n✅ All examples completed successfully!\n');
  } catch (error) {
    console.error('❌ Error running examples:', error);
  }
}

// Export for use elsewhere
export {
  exampleCRUD,
  exampleSearch,
  exampleDuplicates,
  exampleContactPreferences,
  exampleFiltering,
  runExamples,
};

// Run if executed directly (uncomment if needed with CommonJS)
// if (require.main === module) {
//   runExamples();
// }

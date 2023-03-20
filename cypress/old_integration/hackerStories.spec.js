describe('Hacker Stories', () => {
  const initialTerm = 'React'
  const newTerm = 'Cypress'

  context('Hitting the real API', () => {
    beforeEach(() => {
      cy.visit('/')
      cy.intercept('GET', `**/search?query=${initialTerm}&page=0`).as('getInitialTerm')
      cy.intercept('GET', `**/search?query=${initialTerm}&page=1`).as('getMoreStories')
      cy.intercept('GET', `**/search?query=${newTerm}&page=0`).as('getNewTerm')
    })
    context('Search', () => {
      it('shows 20 stories, then the next 20 after clicking "More"', () => {
        cy.get('.item').should('have.length', 20)
        cy.contains('More').click()
        cy.wait('@getMoreStories')
        cy.get('.item').should('have.length', 40)
      })

      it('searches via the last searched term', () => {
        cy.get('#search').clear().type(`${newTerm}{enter}`)
        cy.wait('@getNewTerm')
        cy.get(`button:contains(${initialTerm})`).should('be.visible').click()
        cy.wait('@getInitialTerm')
        cy.get('.item').should('have.length', 20)
        cy.get('.item').first().should('contain', initialTerm)
        cy.get(`button:contains(${newTerm})`).should('be.visible')
      })

      it.skip('types and submits the form directly', () => {
        cy.get('form input[type="text"]')
          .should('be.visible')
          .clear()
          .type(newTerm)
        // the .submit() method is just an alternative to some approaches but in general it´s no recommended
        cy.get('form').submit()
        cy.wait('@getNewTerm')
        // Assertion here
        cy.get('.item').prevAll().should('have.length', 20).contains(newTerm)
      })
    })
  });

  context('Mock API Response', () => {
    beforeEach(() => {
      // First we prepare the first intercept to do the same request as the original one,
      // but with a empty response, if the visit runs first, will be loaded with all regular data
      cy.intercept('GET', `**/search?query=${initialTerm}&page=0`, { fixture: 'empty' }).as('getEmptyMock')
      cy.visit('/')
      cy.wait('@getEmptyMock')
      cy.get('#search').clear()
      cy.intercept('GET', `**/search?query=${newTerm}&page=0`, { fixture: 'stories' }).as('getMockAPI')
      cy.intercept('GET', `**/search**`, { fixture: 'empty' }).as('getAnySearch')
    });
    it('shows only 3 stories after dimissing the first story', () => {
      cy.get('#search')
        .type(`${newTerm}{enter}`)
      cy.get('.button-small')
        .first()
        .click()
      cy.wait('@getMockAPI')
      cy.get('.item').should('have.length', 3)
    })

    it('types and hits ENTER', () => {
      cy.get('#search')
        .type(`${newTerm}{enter}`)
      cy.wait('@getMockAPI')
      cy.get('.item').should('have.length', 4)
      cy.get('.item')
        .first()
        .should('contain', newTerm)
      cy.get(`button:contains(${initialTerm})`)
        .should('be.visible')
    })

    it('types and clicks the submit button', () => {
      cy.get('#search').clear()
        .type(newTerm)
      cy.contains('Submit')
        .click()
      cy.wait('@getMockAPI')
      cy.get('.item').should('have.length', 4)
      cy.get('.item')
        .first()
        .should('contain', newTerm)
      cy.get(`button:contains(${initialTerm})`)
        .should('be.visible')
    })

    it('shows a max of 5 buttons for the last searched terms', () => {
      const faker = require('faker')
      Cypress._.times(6, () => {
        cy.get('#search')
          .clear()
          .type(`${faker.random.word()}{enter}`)
        cy.wait('@getAnySearch')
      })
      cy.get('.last-searches button')
        .should('have.length', 5)
    })
  });

  context('List of stories', () => {
    beforeEach(() => {
      cy.visit('/')
    });
    it('shows the footer', () => {
      cy.get('footer')
        .should('be.visible')
        .and('contain', 'Icons made by Freepik from www.flaticon.com')
    })
    // Since the API is external,
    // I can't control what it will provide to the frontend,
    // and so, how can I assert on the data?
    // This is why this test is being skipped.
    // TODO: Find a way to test it out.
    it.skip('shows the right data for all rendered stories', () => { })
    // Since the API is external,
    // I can't control what it will provide to the frontend,
    // and so, how can I test ordering?
    // This is why these tests are being skipped.
    // TODO: Find a way to test them out.
    context.skip('Order by', () => {
      it('orders by title', () => { })

      it('orders by author', () => { })

      it('orders by comments', () => { })

      it('orders by points', () => { })
    })
  })
})
// Hrm, how would I simulate such errors?
// Since I still don't know, the tests are being skipped.
// TODO: Find a way to test them out.
// As long we need to visit the base url again, this context must be out of the describe
context('Errors', () => {
  const errorMsg = 'Something went wrong ...'
  it('shows "Something went wrong ..." in case of a server error', () => {
    cy.intercept(
      'GET',
      '**/search**',
      { statusCode: 500 }
    ).as('getServerFailure')
    cy.visit('/')
    cy.wait('@getServerFailure')
    cy.get(`p:contains(${errorMsg})`).should('be.visible')
  })

  it('shows "Something went wrong ..." in case of a network error', () => {
    cy.intercept(
      'GET',
      '**/search**',
      { forceNetworkError: true }
    ).as('getNetworkFailure')
    cy.visit('/')
    cy.wait('@getNetworkFailure')
    //cy.get(`p:contains(${errorMsg})`).should('be.visible')
    cy.get('.container').contains(errorMsg).should('be.visible')
  })
})



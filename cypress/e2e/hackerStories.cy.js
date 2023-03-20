describe('Hacker Stories', () => {
  const initialTerm = 'React'
  const newTerm = 'Cypress'
  const stories = require('../fixtures/stories.json');

  context('Hitting the real API', () => {
    beforeEach(() => {
      cy.visit('/')
      cy.intercept('GET', `**/search?query=${initialTerm}&page=0`).as('getInitialTerm')
      cy.intercept('GET', `**/search?query=${initialTerm}&page=1`).as('getMoreStories')
      cy.intercept('GET', `**/search?query=${newTerm}&page=0`).as('getNewTerm')
      cy.intercept('GET', `**/search**`).as('getAnySearch')
    })
    context('Search', () => {
      it('shows 20 stories, then the next 20 after clicking "More"', () => {
        cy.get('.item').as('storiesList')
        cy.get('@storiesList').should('have.length', 20).and('be.visible')
        cy.contains('More').should('be.visible').click()
        cy.wait('@getMoreStories')
        cy.get('@storiesList').should('have.length', 40)
      })

      it('searches via the last searched term', () => {
        cy.get('#search').should('be.visible').clear().type(`${newTerm}{enter}`)
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
      it('shows the last three searched terms for quick searching', () => {
        const termsToSearchFor = [
          'foo',
          'bar',
          'baz'
        ]
        termsToSearchFor.forEach(term => {
          cy.get('#search')
            .should('be.visible')
            .clear()
            .type(`${term}{enter}`)
          // nested validation
          cy.wait('@getAnySearch')// wait for the data submition
          cy.getLocalStorage('search').should('be.eq', term)
        })

        // when is need to validate an array of keys, the bellow approach is recommended
        // cy.getLocalStorage('search')//search is the Key name inside the Local Storage element
        //   .then($search => {
        //     // expect($search.includes(termsToSearchFor[0])).to.equal(true)
        //     // expect($search.includes(termsToSearchFor[1])).to.equal(true)
        //     expect($search.includes(termsToSearchFor[2])).to.equal(true)
        //   })
      });

    })
  });

  context('Mock API Response', () => {

    beforeEach(() => {
      // First we prepare the first intercept to do the same request as the original one,
      // but with a empty response, if the visit runs first, will be loaded with all regular data
      // The intercept that load empty response must be run first, if notwill load empty data after visit runs
      cy.intercept('GET', `**/search**`, { fixture: 'empty' }).as('getAnySearch')
      cy.intercept('GET', `**/search?query=${initialTerm}&page=0`, { fixture: 'empty' }).as('getEmptyMock')
      cy.visit('/')
      cy.wait('@getEmptyMock')
      cy.get('#search').should('be.visible').clear()
      cy.intercept('GET', `**/search?query=${initialTerm}&page=0`, { fixture: 'stories' }).as('getMockAPIInitial')
      cy.intercept('GET', `**/search?query=${newTerm}&page=0`, { fixture: 'stories' }).as('getMockAPINew')
    });
    it('shows only 3 stories after dimissing the first story', () => {
      cy.get('#search').should('be.visible')
        .type(`${newTerm}{enter}`)
      cy.get('.button-small').as('actionCheckBox')
      cy.wait('@getMockAPINew')
      cy.get('@actionCheckBox').should('be.visible')
        .first()
        .click()
      cy.get('.item').should('have.length', 3)
    })

    it('types and hits ENTER', () => {
      cy.get('#search').should('be.visible')
        .type(`${newTerm}{enter}`)
      cy.wait('@getMockAPINew')
      cy.get('.item').should('have.length', 4)
      cy.get('.item')
        .first()
        .should('contain', newTerm)
      cy.get(`button:contains(${initialTerm})`)
        .should('be.visible')
    })

    it('types and clicks the submit button', () => {
      cy.get('#search').should('be.visible')
        .type(newTerm)
      cy.contains('Submit').should('be.visible')
        .click()
      cy.wait('@getMockAPINew')
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
        cy.get('#search').should('be.visible')
          .clear()
          .type(`${faker.random.word()}{enter}`)
        cy.wait('@getAnySearch')
      })
      // cy.get('.last-searches button')
      //   .should('have.length', 5)
      cy.get('.last-searches').within(() => {
        cy.get('button').should('have.length', 5)
      })
    })

    it('Unmark all Options', () => {
      cy.get('#search').should('be.visible')
        .type(`${newTerm}{enter}`)
      cy.get('.item>span>a').each(($el, index, $list) => {
        console.log($el.text() + ' *** ' + index)
      })
      cy.get('.button-small').each(($el, index, $list) => {
        cy.get($el).should('be.visible').click()
      })
      cy.get('.button-small').should('not.exist')
    });

    it('shows the right data for all rendered stories', () => {
      cy.get('#search').should('be.visible')
        .type(`${newTerm}{enter}`)
      cy.wait('@getMockAPINew')
      cy.get('.item>span>a').first().should('have.text', newTerm)
      cy.get('.item>span>a').last().should('have.text', initialTerm)
      //Using the stories.json as expected result source
      cy.get('.item').first().should('contain', stories.hits[0].title)
      cy.get(`.item a:contains(${stories.hits[0].title})`).should('have.attr', 'href', stories.hits[0].url)
      cy.get('.item').last().should('contain', stories.hits[3].title)
      cy.get(`.item a:contains(${stories.hits[3].title})`).should('have.attr', 'href', stories.hits[3].url)
    })
    it('shows no story when none is returned', () => {
      cy.get('.item').should('have.length', 0)
    });

    context('Order by', () => {

      beforeEach(() => {
        cy.get('#search')
          .type(`${newTerm}{enter}`)
        cy.wait('@getMockAPINew')
      });
      it('orders by title', () => {
        // Using aliases improves readability
        cy.get('.list-header-button:contains(Title)').as('titleButton')
        cy.get('.item>span>a').as('storyTitle')

        cy.get('@titleButton').should('be.visible').click()
        cy.get('@storyTitle').first().should('have.text', stories.hits[0].title)
        cy.get('@storyTitle').last().should('have.text', stories.hits[3].title)
        // cy.get('.item-header > span:nth-child(1) > button').dblclick()
        cy.get('@titleButton').click()// Another way to use a locator
        cy.get('@storyTitle').first().should('have.text', stories.hits[3].title)
        cy.get('@storyTitle').last().should('have.text', stories.hits[0].title)
      })

      it('orders by author', () => {
        cy.get('.item> span:nth-child(2)').first().should('have.text', stories.hits[0].author)
        cy.get('.item> span:nth-child(2)').last().should('have.text', stories.hits[3].author)
        cy.get('.item-header > span:nth-child(2) > button').should('be.visible').click()
        cy.get('.item> span:nth-child(2)').first().should('have.text', stories.hits[3].author)
        cy.get('.item> span:nth-child(2)').last().should('have.text', stories.hits[1].author)
      })

      it('orders by comments', () => {
        cy.get('.item> span:nth-child(3)').first().should('have.text', stories.hits[0].num_comments)
        cy.get('.item> span:nth-child(3)').last().should('have.text', stories.hits[3].num_comments)
        cy.get('.item-header > span:nth-child(3) > button').should('be.visible').dblclick()
        cy.get('.item> span:nth-child(3)').first().should('have.text', stories.hits[3].num_comments)
        cy.get('.item> span:nth-child(3)').last().should('have.text', stories.hits[0].num_comments)
      })

      it('orders by points', () => {
        cy.get('.item> span:nth-child(4)').first().should('have.text', stories.hits[0].points)
        cy.get('.item> span:nth-child(4)').last().should('have.text', stories.hits[3].points)
        cy.get('.item-header > span:nth-child(4) > button').should('be.visible').dblclick()
        cy.get('.item> span:nth-child(4)').first().should('have.text', stories.hits[1].points)
        cy.get('.item> span:nth-child(4)').last().should('have.text', stories.hits[0].points)
      })
    })
    context('Delay simulation', () => {
      beforeEach(() => {
        cy.intercept('GET', '**/search**', { delay: 1000, fixture: 'stories' }).as('getDelayedStories')
      });
      it('shows a loading state before showing the results', () => {
        cy.get('#search').should('be.visible').clear().type(newTerm)
        cy.get('.search-form > .button').click()
        cy.get('p:contains(Loading ...)').should('be.visible')
        cy.wait('@getDelayedStories')

      });
    });
  });
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



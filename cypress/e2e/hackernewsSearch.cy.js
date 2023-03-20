describe('Hacker News Search', () => {
    const term = 'cypress.io'
    let count = 0
    let countR = 0
    beforeEach(() => {
        // instance the intercept to get any request and input a mock empty response to detach from real API dependendy
        // The first count will be made here, so the counter will start at 2
        cy.intercept(`**/search**`, req => { countR += 1, req.reply({ fixture: 'empty' }) }).as('random')
        // instance the intercept to validate the number of times the request for a single term is made and detach the response from real API
        cy.intercept(`**/search?query=${term}&page=0&hitsPerPage=100`, req => { count += 1, req.reply({ fixture: 'stories' }) }).as('term')
        cy.visit('https://hackernews-seven.vercel.app/')
        cy.wait('@random')
    })

    it('correctly caches the results', () => {
        const faker = require('faker')
        //run the input 4 times for both single and random search
        Cypress._.times(4, () => {
            let rTerm = faker.random.word()
            cy.get('input').clear().type(`${term}{enter}`).then(() => {
                console.log('Term: ' + count)
                // The counter for the single term is always 1 because the term is stored in cache and never do a new request for the same request
                expect(count, `The count of times the single term '${term}' was called is ${count}`).to.be.equal(1)
            })
            cy.get('input').clear().type(`${rTerm}{enter}`).then(() => {
                console.log('Random:' + countR)
                // The counter will be validated for each loop here, starting from 2 due the before each
                expect(countR, `The count of times the random term '${rTerm}' was called is ${countR}`).to.be.oneOf([2, 3, 4, 5])
            })
        })
    })
})
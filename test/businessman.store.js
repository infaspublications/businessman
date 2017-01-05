import { install, subscribe } from '../src/businessman'

describe( 'Businessman Store Style Specs', function () {
	var stores
	let initialize = false

	beforeEach( done => {
		let i = 0
		const counterSubscriber = state => {
			i++
			if ( state === 0 && i === 2 ) {
				stores.counter.unsubscribe()
				done()
			}
		}
		const messageSubscriber = state => {
			i++
			if ( state === '' && i === 2 ) {
				stores.message.unsubscribe()
				done()
			}
		}
		if ( initialize ) {
			stores.counter.unsubscribe()
			stores.message.unsubscribe()
			stores.counter.dispatch( 'set', 0 )
			stores.message.dispatch( 'set', '' )
			stores.counter.subscribe( counterSubscriber )
			stores.message.subscribe( messageSubscriber )
		} else {
			done()
		}
	} )

	it( 'Install Worker', function ( done ) {
		subscribe( 'CREATE_CLIENT_STORE', data => {
			stores = data
			initialize = true
			expect( data ).to.be.ok()
			done()
		} )
		install( '/dist/test-worker.js' )
	} )

	it( 'Store for clients includes dispatch() and subscribe()', function () {
		expect( stores ).to.be.ok()
		let storeKeys = Object.keys( stores )
		for ( let i = 0; i < storeKeys.length; i++ ) {
			let store = storeKeys[ i ]
			expect( stores[ store ] ).to.have.property( 'dispatch' )
			expect( stores[ store ] ).to.have.property( 'subscribe' )
			expect( stores[ store ].dispatch ).to.be.an( 'function' )
			expect( stores[ store ].subscribe ).to.be.an( 'function' )
		}
	} )

	it( 'Dispatch and subscribe', function ( done ) {
		stores.counter.dispatch( 'increment', 1 )
		stores.counter.subscribe( function ( state, applied ) {
			expect( state ).to.be( 1 )
			expect( applied ).to.be( 'increment' )
		} )
		stores.message.dispatch( 'set', 'This is a test' )
		stores.message.subscribe( function ( state, applied ) {
			expect( state ).to.be( 'This is a test' )
			expect( applied ).to.be( 'set' )
			done()
		} )
	} )

	it( 'Unsubscribe', function ( done ) {
		let i = 0
		let counterSubscriber = function () {
			i++
		}
		stores.counter.subscribe( counterSubscriber )
		stores.counter.dispatch( 'increment' )
		setTimeout( function () {
			stores.counter.unsubscribe( counterSubscriber )
			stores.counter.dispatch( 'increment' )
			expect( i ).to.be( 1 )
			done()
		}, 500 )
	} )

	it( 'Get store state', function ( done ) {
		stores.counter.dispatch( 'set', 123456 )
		stores.counter.getState().then( state => {
			expect( state ).to.be( 123456 )
			done()
		} )
	} )
} )
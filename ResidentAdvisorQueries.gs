// Source: https://stackoverflow.com/questions/34182163/how-to-get-residentadvisor-api-work
// This is what led me to believe it would be possible to reach out to Resident Advisor's GraphQL API
//--data '{"query":"query GET_POPULAR_EVENTS($filters: FilterInputDtoInput, $pageSize: Int) { eventListings(filters: $filters, pageSize: $pageSize, page: 1, sort: { attending: { priority: 1, order: DESCENDING } }) {   data {     id     listingDate     event {       ...eventFields       __typename     }     __typename   }   __typename }\r\n}\r\n\r\nfragment eventFields on Event { id title attending date contentUrl flyerFront queueItEnabled newEventForm images {   id   filename   alt   type   crop   __typename } venue {   id   name   contentUrl   live   __typename } __typename\r\n}","variables":{"filters":{"areas":{"eq":229},"listingDate":{"gte":"2023-06-01","lte":"2023-08-04"},"listingPosition":{"eq":1}},"pageSize":10}}'



const RA_QUERY_EVENT_LISTINGS = `query GET_EVENT_LISTINGS($filters: FilterInputDtoInput, $filterOptions: FilterOptionsInputDtoInput, $page: Int, $pageSize: Int) {
  eventListings(filters: $filters, filterOptions: $filterOptions, pageSize: $pageSize, page: $page) {
    data {
      id 
      event {
        ...eventListingsFields artists {id name __typename} 
      } 
    } 
    filterOptions {
      genre {label value __typename}
    } 
    totalResults 
    }
  }
  fragment eventListingsFields on Event {
    date 
    startTime 
    endTime 
    title 
    contentUrl 
    attending 
    images {
      id 
      filename 
    } 
    venue {
      id 
      name 
      address
      contentUrl 
    } 
}`;

const RA_QUERY_POPULAR_EVENTS = `query GET_POPULAR_EVENTS($filters: FilterInputDtoInput, $pageSize: Int) { 
  eventListings(filters: $filters, pageSize: $pageSize, page: 1, sort: {   
    attending: { priority: 1, order: DESCENDING } }) {   
      data {     
        id     
        listingDate     
        event {       
          ...eventFields artists {id name __typename}        
          __typename     
        }     
        __typename   
      }
      totalResults    
      __typename 
    }
  }
  fragment eventFields on Event { 
    id 
    title 
    attending 
    date 
    contentUrl 
    flyerFront 
    queueItEnabled 
    newEventForm 
    images {   
      id   
      filename   
      alt   
      type   
      crop   
      __typename 
      } 
    venue {  
      id   
      name  
      address 
      contentUrl  
      live    
      __typename 
    }
    __typename 
}`;

const RA_QUERY_ENUMERATE = `query IntrospectionQuery {
  __schema {
    queryType { name }
    mutationType { name }
    subscriptionType { name }
    types {
      ...FullType
    }
    directives {
      name
      description
      locations
      args {
      ...InputValue
      }
    }
  }
  fragment FullType on __Type {
    kind
    name
    description
    fields(includeDeprecated: true) {
      name
      description
      args {
        ...InputValue
      }
      type {
        ...TypeRef
      }
      isDeprecated
      deprecationReason
    }
    inputFields {
      ...InputValue
    }
    interfaces {
      ...TypeRef
    }
    enumValues(includeDeprecated: true) {
      name
      description
      isDeprecated
      deprecationReason
    }
    possibleTypes {
      ...TypeRef
    }
  }
  fragment InputValue on __InputValue {
    name
    description
    type { ...TypeRef }
    defaultValue
  }
  fragment TypeRef on __Type {
    kind
    name
    ofType {
      kind
      name
      ofType {
        kind
        name
        ofType {
          kind
          name
          ofType {
            kind
            name
            ofType {
              kind
              name
              ofType {
                kind
                name
                ofType {
                  kind
                  name
                }
              }
          }
        }
      }
    }
  }
}`;

const RA_QUERY_SCHEMA = `fragment FullType on __Type {
  kind
  name
  fields(includeDeprecated: true) {
    name
    args {
      ...InputValue
    }
    type {
      ...TypeRef
    }
    isDeprecated
    deprecationReason
  }
  inputFields {
    ...InputValue
  }
  interfaces {
    ...TypeRef
  }
  enumValues(includeDeprecated: true) {
    name
    isDeprecated
    deprecationReason
  }
  possibleTypes {
    ...TypeRef
  }
  }
  fragment InputValue on __InputValue {
    name
    type {
      ...TypeRef
    }
    defaultValue
  }
  fragment TypeRef on __Type {
    kind
    name
    ofType {
      kind
      name
      ofType {
        kind
        name
        ofType {
          kind
          name
          ofType {
            kind
            name
            ofType {
              kind
              name
              ofType {
                kind
                name
                ofType {
                  kind
                  name
                }
              }
            }
          }
        }
      }
    }
  }
  query IntrospectionQuery {
    __schema {
      queryType {
        name
      }
      mutationType {
        name
      }
      types {
        ...FullType
      }
      directives {
        name
        locations
        args {
          ...InputValue
        }
      }
    }
}`;

const RA_SEARCH = `query {
  search(type:EventListing, query:"areas:218") {
    pageInfo {
      startCursor
      hasNextPage
      endCursor
    }
    userCount
    nodes {
      ... on User {
        bio
        company
        email
        id
        isBountyHunter
        isCampusExpert
        isDeveloperProgramMember
        isEmployee
        isHireable
        isSiteAdmin
        isViewer
        location
        login
        name
        url
        websiteUrl
      }
    }
  }
}`;

const RA_QUERY_TEST = `query GET_EVENTS($filters: FilterInputDtoInput, $pageSize: Int) {
  eventListings(filters: $filters, pageSize: $pageSize, page: 1, sort: {   
    attending: { priority: 1, order: DESCENDING } }) { 
      data {
        id
        listingDate
        event {
          ...eventFields  
          __typename 
        }     
        __typename   
      }   
      __typename 
    }
  }
  fragment eventFields on Event { 
    id 
    title 
    attending 
    date 
    contentUrl 
    flyerFront 
    queueItEnabled 
    newEventForm 
    images {   
      id   
      filename   
      alt   
      type   
      crop   
      __typename 
    } 
    venue {  
      id   
      name   
      address
      contentUrl  
      live    
      __typename 
    }
    __typename 
  }
}`;
    





